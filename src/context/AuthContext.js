import { createContext, useContext, useEffect, useState } from 'react';
import { useSentry } from "./SentryContext";
import { useLocation, useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from "firebase/auth";
import { auth, db } from '../firebase';
import { doc, getDoc, query, setDoc, collection, updateDoc, onSnapshot, addDoc, deleteDoc } from 'firebase/firestore';

const UserContext = createContext();

export const AuthContextProvider = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { Sentry } = useSentry();
  const { pathname } = location;
  const [user, setUser] = useState(null);
  const [gearedUser, setGearedUser] = useState(null);
  const [orgID, setOrgID] = useState('');
  const [truckTypes, setTruckTypes] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [organizationNames, setOrganizationNames] = useState([]);
  const [trucks, setTrucks] = useState([]);
  const [trailers, setTrailers] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [compliances, setCompliances]= useState([]);
  const [outsideTrucks, setOutsideTrucks] = useState([]);
  const [subhaulers, setSubhaulers] = useState([]);
  const [capabilities, setCapabilities] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [locations, setLocations] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [company, setCompany] = useState({});
  const [loading, setLoading] = useState(true);
  const [gearedVersion, setGearedVersion] = useState('2.680');
  const [refreshCount, setRefreshCount] = useState(0);
  const [autocompleteService, setAutocompleteService] = useState(null);

  
  const [driverComplianceNames, setDriverComplianceNames] = useState([]);
  const [truckComplianceNames, setTruckComplianceNames] = useState([]);
  const [trailerComplianceNames, setTrailerComplianceNames] = useState([]);
  const [expenseNames, setExpenseNames] = useState([]);;

  const makeSelectItem = (gearedItem, id) => {
    gearedItem.text = gearedItem.Name ? gearedItem.Name : gearedItem.DriverName;
    gearedItem.value = id;
    gearedItem.ID = id;
    return gearedItem;
  };

    
  const makeLocationSelectItem = (gearedItem, id) => {
    gearedItem.text = gearedItem.Name;
    gearedItem.value = id;
    gearedItem.locSelect=true;
    gearedItem.ID = id;
    return gearedItem;
  };
  const fetchDefaultNames = (selectedOrgName) => {
    const q = query(collection(db, `Organizations/${selectedOrgName}/DefaultNames`));
    onSnapshot(q, (querySnapshot) => {
      const driverComplianceNamesTemp = [];
      const truckComplianceNamesTemp = [];
      const trailerComplianceNamesTemp = [];
      const expenseNamesTemp = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const item = makeSelectItem(data, doc.id);
      
        switch (data.Type) {
          case 'DriverCompliance':
            driverComplianceNamesTemp.push(item);
            break;
          case 'TruckCompliance':
            truckComplianceNamesTemp.push(item);
            break;
          case 'TrailerCompliance':
            trailerComplianceNamesTemp.push(item);
            break;
          case 'Expense':
            expenseNamesTemp.push(item);
            break;
          default:
            break;
        }
      });

      setDriverComplianceNames(driverComplianceNamesTemp);
      setTruckComplianceNames(truckComplianceNamesTemp);
      setTrailerComplianceNames(trailerComplianceNamesTemp);
      setExpenseNames(expenseNamesTemp);
    });
  };
  const fetchCollectionData = (collectionPath, setState, transformer, filter = () => true) => {
    const q = query(collection(db, collectionPath));
    onSnapshot(q, (querySnapshot) => {
      setState(prevState => {
        let data = [...prevState];
        querySnapshot.docChanges().forEach((change) => {
          const newItem = transformer(change.doc.data(), change.doc.id);
          if (filter(newItem)) {
            switch (change.type) {
              case 'added':
                data.push(newItem);
                break;
              case 'modified':
                data = data.map(item => item.ID === change.doc.id ? newItem : item);
                break;
              case 'removed':
                data = data.filter(item => item.ID !== change.doc.id);
                break;
              default:
                break;
            }
          }
        });
        return data;
      });
    });
  };

  const logout = () => {
    console.log('Logging out...');
    navigate('/');
    return signOut(auth);
  };

  const getCompany = async (selectedOrgName) => {
    console.log('Getting the company for selectedOrgName = ' + selectedOrgName);
    const q = query(collection(db, 'Organizations/' + selectedOrgName + '/Preferences'));
    onSnapshot(q, (querySnapshot) => {
      let tempCompanies = [];
      querySnapshot.docChanges().forEach((change) => {
        let tempCompany = change.doc.data();
        tempCompany.ID = change.doc.id;
        tempCompany.Name= tempCompany.CompanyName;
        switch (change.type) {
          case 'added':
            if (tempCompany.mainCompany) setCompany(tempCompany);
            tempCompanies.push(tempCompany);
            break;
          case 'modified':
            tempCompanies = tempCompanies.map(company => company.ID === change.doc.id ? tempCompany : company);
            break;
          case 'removed':
            tempCompanies = tempCompanies.filter(company => company.ID !== change.doc.id);
            break;
          default:
            break;
        }
      });
      setCompanies(tempCompanies);
    });
  };

  const signIn = (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  const fetchUserData = async (userId) => {
    const docRef = doc(db, "users", userId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const tempUser = docSnap.data();
      Sentry.configureScope((scope) => { scope.setUser({ "username": tempUser.Name }); });
      window.heap.identify(tempUser.PhoneNumber);
      tempUser.OptIn = true;
      tempUser.selectedOrgName = tempUser.selectedOrgName || "John's Trucking";
      localStorage.setItem('currentOrg', tempUser.selectedOrgName);
      setOrgID(tempUser.selectedOrgName);
      setGearedUser(prevUser => ({ ...prevUser, ...tempUser }));
      await setDoc(docRef, tempUser);
      return tempUser.selectedOrgName;
    }
    return null;
  };

  const handleAuthStateChanged = async (currentUser) => {
    console.log('Auth state changed:', currentUser);
    if (currentUser) {
      setUser(currentUser);
      const selectedOrgName = await fetchUserData(currentUser.uid);
      if (selectedOrgName) getDropDowns(selectedOrgName);
      getVersion();
    } else {
      navigate('/');
    }
  };

  const getDropDowns = (selectedOrgName) => {
    fetchCollectionData(`Organizations/${selectedOrgName}/TruckTypes`, setTruckTypes,makeSelectItem );
    fetchCollectionData(`Organizations/${selectedOrgName}/Materials`,  setMaterials,makeSelectItem);
    fetchCollectionData(`Organizations/${selectedOrgName}/Locations`, setLocations,makeLocationSelectItem  );
    fetchCollectionData(`Organizations/${selectedOrgName}/Trucks`,  setTrucks,  makeSelectItem );
    fetchCollectionData(`Organizations/${selectedOrgName}/Trailers`,   setTrailers, makeSelectItem );
    fetchCollectionData(`Organizations/${selectedOrgName}/Contacts`,   setContacts, makeSelectItem );
    fetchCollectionData(`Organizations/${selectedOrgName}/Compliances`,   setCompliances, makeSelectItem );
    
    fetchCollectionData(`Organizations/${selectedOrgName}/Capabilities`,  setCapabilities,
      (data, id) => {
        data.ID=id;
        data.text = data.Name;
        data.value = data.Name;
        return data;
      }
    );
    fetchCollectionData(`Organizations/${selectedOrgName}/Drivers`,setDrivers,makeSelectItem, (data) => !data.Subhauler);
    fetchCollectionData(`Organizations/${selectedOrgName}/Accounts`,   setSubhaulers, makeSelectItem,(data) => data.Subhauler   );
    fetchCollectionData(`Organizations/${selectedOrgName}/OutsideTrucks`,  setOutsideTrucks,makeSelectItem );
    fetchCollectionData(`Organizations/${selectedOrgName}/Accounts`,   setAccounts,  makeSelectItem );
    getCompany(selectedOrgName);
    fetchDefaultNames(selectedOrgName);
    setLoading(false);
  };

  const getVersion = async () => {
    var firstTime = true;
    console.log('Getting versions of Geared! Refresh count = ' + refreshCount);

    const docRef = doc(db, "TestVersions", "Version");
    onSnapshot(docRef, async (docSnap) => {
      const source = docSnap.metadata.hasPendingWrites ? "Local" : "Server";
      if (docSnap.exists() && source === "Server") {
        if (gearedVersion !== docSnap.data().Version) {
          setRefreshCount(prev => prev + 1);
          localStorage.setItem('refreshCount', refreshCount);
          if (refreshCount < 5) {
            setTimeout(() => window.location.reload(), 3000);
          }
        } else {
          localStorage.setItem('refreshCount', 0);
        }
        if (firstTime) firstTime = false;
      }
    });
  };

  const updateGearedUser = async (tempGearedUser) => {
    if (gearedUser.ID) {
      if (gearedUser.Name !== tempGearedUser.Name || gearedUser.selectedOrgName !== tempGearedUser.selectedOrgName) {
        gearedUser.Name = tempGearedUser.Name;
        gearedUser.selectedOrgName = tempGearedUser.selectedOrgName;
        localStorage.setItem('currentOrg', tempGearedUser.selectedOrgName);
        getDropDowns(tempGearedUser.selectedOrgName);
        setGearedUser(gearedUser);
        let docRef = doc(db, "users", gearedUser.ID);
        await updateDoc(docRef, { Name: tempGearedUser.Name, selectedOrgName: tempGearedUser.selectedOrgName });
      }
    }
  };

  const loginWithConfirmationCode = (confirmationResult, code, phoneNumber) => {
    confirmationResult.confirm(code).then((result) => {
      const user = result.user;
    }).catch((error) => {
      console.error('Error signing in with confirmation code:', error);
    });
  };

  const addNewAccount =(Name, fieldName, fieldChange)=>{
    var Account = {
      ID: '',
      Qty: '', 
      PayFrequency: 'Bi-Weekly',
      Name: Name,
      Priority: '',

      Fax: '',
      Website: '',
      Address: '',
      City: '',
      State: '',
      ZipCode: '',

      PhysicalAddress: '',
      PhysicalAddressName: '',
      PhysAddress: '',
      PhysCity: '',
      PhysState: '',
      PhysZipCode: '',
      Phone: '',
          PhoneObject:{
              Phone1:'',
              Phone2:'',
              Phone3:'',
              Phone4:''
          },
      OfficePhoneObject:{
              Phone1:'',
              Phone2:'',
              Phone3:'',
              Phone4:''
          },
      DedicatedSubhauler: false,
      TaxID: '',
      Track1099: false,
      DriverName:'',
      DriverEmail:'',

      Broker: false,
      Subhauler: false,
      Puller: false,
      Contractor: false,
      phoneOK:false,
      Status: 'Active',

      BrokerFee: '',
      TrailerFee: '',
      PaidBrokerFee: '',
      paidTruckingBrokerTotal:0,
      Notes: '',
      InvoiceNotes: '',
      TermsAndCond: '',
      ShowPhysical: false,

      Username: '',
      QBID: '',
      QBSync: '',
      QBVendorID: '',
      QBVendorSync: '',

      Contacts: [],
      TruckTypes: [],
      Trailers: [],
      Capabilities:[],
      ComplianceNames: [],
      Compliances: [],
      Trucks: [],
      Quickbooks:[],
      NoteList:[],
      Driver: {
          ID: '',
          Truck: {
              ID: '',
              Name: 'No Truck',
          },

          Trailer: {
              ID: '',
              Name: 'No Trailer',
          }
      }
    }

     

    for(var q=0; q<companies; q++){
      if (companies[q].realmID) {
        var newQuickBooks = {
            ID: companies[q].ID,
            CompanyName: companies[q].CompanyName,
            realmID: companies[q].realmID,
            QBCustomerID: '',
            QBCustomerSync: '',
            QBVendorID: '',
            QBVendorSync: '',
            QBUpdated: false
        };
        Account.Quickbooks.push(newQuickBooks);
      }
    }
    addDoc(collection(db, `Organizations/${gearedUser.selectedOrgName}/Accounts`), Account).then(function (docRef) {
      console.log("Account written with ID: ", docRef.id);
      Account.ID=docRef.id;
      fieldChange(fieldName,Account, true )
    });

  }
  const addNewLocation = (locType, selectValue,  fieldChange)=>{
    var Location = {...selectValue}
    Location.ZipCode='';
    Location.fullAddress = Location.Address + ', ' + Location.City + ', ' + Location.State + ', ' + Location.ZipCode;
    Location.Address2= Location.City + ', ' + Location.State + ', ' + Location.ZipCode;
    Location.text= Location.Name;
    Location.locSelect=true;
    for(var i=0; i<locations.length; i++){
      if(locations[i].place_id===Location.place_id){
        return fieldChange(locType, locations[i], true )
      }
    }
    console.log('add new locations = ', Location)
     addDoc(collection(db, `Organizations/${gearedUser.selectedOrgName}/Locations`),Location).then(function (docRef) {
       console.log("Location written with ID: ", docRef.id);
       Location.ID=docRef.id;
       Location.value=docRef.id;
       return fieldChange(locType,Location, true )
     });
   }
  const addNewMaterial = (Name,fieldChange)=>{
   var Material = {
      ID: '',
      Name: Name,
      YardsPerTon: ''
  }
    addDoc(collection(db, `Organizations/${gearedUser.selectedOrgName}/Materials`), Material).then(function (docRef) {
      console.log("Material written with ID: ", docRef.id);
      Material.ID=docRef.id;
      fieldChange('Material',Material, true )
    });
  }
  const addNewTruckType = (Name, fieldChange)=>{
    var TruckType = {
      ID: '',
      Name: Name,
      TruckCode: '',
      DefaultRate: '',
      WeekendRate: '',
      NightRate: '',
      NumOfAxles: '',
      CapacityTons: '',
      CapacityYards: '',
      Default:false
  };
 
     addDoc(collection(db, `Organizations/${gearedUser.selectedOrgName}/TruckTypes`), TruckType).then(function (docRef) {
       console.log("trucktype written with ID: ", docRef.id);
       TruckType.ID=docRef.id;
       fieldChange('TruckType',TruckType, true)
     });
  }

  const addNewDefaultName = (Name,fieldChange, defaultNameType)=>{
    var DefaultName = {
       ID: '',
       Name: Name,
      Type: defaultNameType
   }
   console.log('adding new dfault name =', DefaultName)
     addDoc(collection(db, `Organizations/${gearedUser.selectedOrgName}/DefaultNames`), DefaultName).then(function (docRef) {
       console.log("Default Name written with ID: ", docRef.id);
       DefaultName.ID=docRef.id;
       fieldChange('Name',DefaultName )
     });
   }
  const addDocument = (object, collectionName)=>{
   
    let addDocRef =   collection(db, 'Organizations/' + gearedUser.selectedOrgName + '/'+collectionName);  
    return addDoc(addDocRef, object).then(function (docRef) {
      console.log("collectionName document written with ID: ", docRef.id);
      object.ID = docRef.id;
      return docRef.id; // Return the ID from the promise
  });
  }
  const updateDocument = (updateObject, id, collectionName)=>{ 
    console.log('updating an object with id = ' + id + ' for the colleciton = '+ collectionName +' and the updateobject =' , updateObject)
    updateObject.timestamp=Date.now();
    let updateDocRef =  doc(db, 'Organizations/' + gearedUser.selectedOrgName + '/'+collectionName, id);
    if(collectionName==='users')updateDocRef =  doc(db, 'users/', id);
    updateDoc(updateDocRef, updateObject);
  }   
   

  const deleteDocument = async (deletedObject, collectionName) => {
    try {
      console.log('trying to dlete = ', deletedObject)
        await deleteDoc(doc(db, 'Organizations/' + gearedUser.selectedOrgName + '/' + collectionName, deletedObject.ID))
            .then(() => {
                console.log(`Successfully deleted document from ${collectionName}`);
            })
            .catch((error) => {
                console.error(`Error removing document from ${collectionName}: `, error);
            });
    } catch (error) {
        console.error(`Error executing deleteDocument for ${collectionName}: `, error);
    }
};

function formatDate(date, divider, format) {
  var d = new Date(date),
      month = '' + (d.getMonth() + 1),
      day = '' + d.getDate(),
      year = d.getFullYear();

  if (month.length < 2)  month = '0' + month;
  if (day.length < 2)  day = '0' + day;

  if(format==='YYYY/MM/DD')return [year, month, day].join(divider);
  else return [month, day,year].join(divider);
}
  
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, handleAuthStateChanged);

    if (!window.google) {
      const script = document.createElement('script');
      console.log('scriptib');
      script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyBLRfT0lk65I2sQ7nJaHVWddKclD6ohiHI&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => {
          console.log('window.google seco = ',window.google.maps.places.AutocompleteService)
        setAutocompleteService(new window.google.maps.places.AutocompleteService()    );
      };
      document.head.appendChild(script);
    } else {
      setAutocompleteService(
        new window.google.maps.places.AutocompleteService()
      );
    }
    console.log('AuthContext loading state:', loading); 
    return () => {
      setLoading(false);
      unsubscribe();
    };
  }, []);

  return (
    <UserContext.Provider value={{
      signInWithEmailAndPassword, loginWithConfirmationCode,  signOut, signIn, logout, user,  gearedUser, updateGearedUser, autocompleteService, loading,   
      companies, company, organizationNames, driverComplianceNames, truckComplianceNames,trailerComplianceNames, expenseNames,
      accounts, subhaulers, contacts, drivers, outsideTrucks, truckTypes, trucks, trailers, locations, materials, capabilities,compliances,
      addDocument, updateDocument, deleteDocument,formatDate,
      addNewAccount,addNewMaterial,addNewTruckType, addNewLocation, addNewDefaultName
       
    }}>
      {children}
    </UserContext.Provider>
  );
};

export const UserAuth = () => {
  return useContext(UserContext);
};