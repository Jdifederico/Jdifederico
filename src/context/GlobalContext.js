import React,{useState,useContext,createContext, useRef} from 'react'
import { UserAuth } from './AuthContext';
const GlobalContext = createContext();

export const GlobalContextProvider = ({ children }) => {
    const [accountVisible, setAccountVisible] = useState(false);
    const [account, setAccount] = useState({});
    const [contactVisible, setContactVisible] = useState(false);
    const [contact, setContact] = useState({});
    const [driverVisible, setDriverVisible] = useState(false);
    const [driver, setDriver] = useState({});
    const [materialVisible, setMaterialVisible] = useState(false);
    const [material, setMaterial] = useState({});
    const [nameVisible, setNameVisible] = useState(false);
    const [nameObject, setNameObject] = useState({});
    const [nameType, setNameType] = useState('');
    const [truckVisible, setTruckVisible] = useState(false);
    const [truck, setTruck] = useState({});
    const [trailerVisible, setTrailerVisible] = useState(false);
    const [trailer, setTrailer] = useState({});
    const [truckTypeVisible, setTruckTypeVisible] = useState(false);
    const [truckType, setTruckType] = useState({});
    const [locationVisible, setLocationVisible] = useState(false);
    const [location, setLocation] = useState({});

    const [options, setOptions] = useState({});
    const [imageURL,setImageURL] = useState('');
    const imageRef = useRef(null);
  

    const { accounts, contacts, drivers, materials, truckTypes, locations, trucks, trailers, expenseNames, capabilities, companies, driverComplianceNames, truckComplianceNames, trailerComplianceNames } = UserAuth();
    console.log('OPTIONS AHVE BEEN SET = ' , options)
    const showAccountPopUp = (Account) =>{
        for(let i=0; i<accounts.length; i++)if(accounts[i].ID===Account.ID)setAccount({...accounts[i]})
        setAccountVisible(true);
    }
    const showContactPopUp = (Contact) =>{
        if(Contact.ID){
            for(let i=0; i<contacts.length; i++)if(contacts[i].ID===Contact.ID)setContact({...contacts[i]})
        }else setContact({...Contact})
        setContactVisible(true);
    }
    const showDriverPopUp = (Driver) =>{
        if(Driver.ID){
            for(let i=0; i<drivers.length; i++)if(drivers[i].ID===Driver.ID)setDriver({...drivers[i]})
        }else setDriver({...Driver})
        setDriverVisible(true);
    }
    const showMaterialPopUp = (Material) =>{
        for(let i=0; i<materials.length; i++)if(materials[i].ID===Material.ID)setMaterial({...materials[i]})
        setMaterialVisible(true);
    }
    const showTruckPopUp = (Truck) =>{
        for(let i=0; i<trucks.length; i++)if(trucks[i].ID===Truck.ID)setTruck({...trucks[i]})
        setTruckVisible(true);
    }
    const showTrailerPopUp = (Trailer) =>{
        for(let i=0; i<trailers.length; i++)if(trailers[i].ID===Trailer.ID)setTrailer({...trailers[i]})
        setTrailerVisible(true);
    }

    const showTruckTypePopUp = (TruckType) =>{
        for(let i=0; i<truckTypes.length; i++)if(truckTypes[i].ID===TruckType.ID)setTruckType({...truckTypes[i]})
        setTruckTypeVisible(true);
    }
    const showLocationPopUp = (Location) =>{
        for(let i=0; i<locations.length; i++)if(locations[i].ID===Location.ID)setLocation({...locations[i]})
        setLocationVisible(true);
    }

    const showImagePopUp = (url, event) =>{
        setImageURL(url);
        imageRef.current.toggle(event);
      
    }

    const newAccount = () =>{
        var Account = {
            ID: '',
            Qty: '', 
            PayFrequency: 'Bi-Weekly',
            Name: '',
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
        
        setAccount(Account);
        setAccountVisible(true)
    }

    const newContact = () =>{
        let Contact = {
            ID: '',
            officeAccount:false,
            Account: {
                ID: '',
                Name:'',
                OrgName:''
            },
            Name: '',
            FirstName: '',
            LastName: '',
            PhoneObject:{
                Phone1:'',
                Phone2:'',
                Phone3:'',
                Phone4:''
            },
            phoneOK:false,
            Phone: '',
            Email: '',
            Department: 'Foreman',
            Fax: '',
            createLogIn:false
        }
         setContact(Contact);
         setContactVisible(true)
    }
    const newDriver = () =>{
        //newdriver code here
        console.log('lezz go!')
    }
    const newLocation = () =>{
       let Location = {
            ID: '',
            Name: '',
            Address: '',
            State:'',
            City: '',
            ZipCode: '',
            Plant:false
        }
        setLocation(Location);
        setLocationVisible(true)
    }

    const newMaterial = () =>{
        let Material = {
             ID: '',
             Name: '',
            YardsPerTon:''
         }
         setMaterial(Material);
         setMaterialVisible(true)
    }
    const newTruck = () =>{
        let Truck = {
            ID: '',
            Name: '',
            VIN:'',
            License:'',
            Make:'',
            Model:'',
            Year:'',
            Status:'Active',
            Compliances:[]
        }
        setTruck(Truck);
        setTruckVisible(true)
    }
    const newTrailer = () =>{
        let Trailer = {
            ID: '',
            Name: '',
            Make:'',
            Model:'',
            License:'',
            Year:'',
            Status:'Active',
            Compliances:[]
        }
        setTrailer(Trailer);
        setTrailerVisible(true)
    }
    const newTruckType= () =>{
        let TruckType = {
            ID: '',
            Name: '',
            TruckCode: '',
            DefaultRate: '',
            WeekendRate: '',
            NightRate: '',
            NumOfAxles: '',
            CapacityTons: '',
            CapacityYards: '',
            Default:false
        }
        setTruckType(TruckType);
        setTruckTypeVisible(true)
    }

    const newDefaultName = (compType) =>{
        let Name = {
            ID: '',
            Name: '',
            Type:compType
         
        }
        setNameObject(Name);
        setNameType('DefaultNames');
        setNameVisible(true)
    }

    const newCapability = () =>{
        let Name = {
            ID: '',
            Name: ''
         
        }
        setNameObject(Name);
        setNameType('Capabilities');
        setNameVisible(true);
    }
   
    const showNamePopUp = (NameObject, nameType) => {
 
        const dataMap = {
            capabilities: {
                array: capabilities,
                collectionName: 'Capabilities'
            },
            expenseNames: {
                array: expenseNames,
                collectionName: 'DefaultNames'
            },
            driverComplianceNames: {
                array: driverComplianceNames,
                collectionName: 'DefaultNames'
            },
            truckComplianceNames: {
                array: truckComplianceNames,
                collectionName: 'DefaultNames'
            },
            trailerComplianceNames: {
                array: trailerComplianceNames,
                collectionName: 'DefaultNames'
            },
       
        };
    
        // Access the correct array and collection name using the nameType string
        const dataEntry = dataMap[nameType];
    
        if (dataEntry) {
            const nameArray = dataEntry.array;
    
            for (let i = 0; i < nameArray.length; i++) {
                if (nameArray[i].ID === NameObject.ID) {
                    setNameObject(nameArray[i]);
                    break;
                }
            }
            setNameType(dataEntry.collectionName);
            setNameVisible(true);
        } 
    };

    const formatDate = (date, divider, format) =>{
        var d = new Date(date),
            month = '' + (d.getMonth() + 1), 
            day = '' + d.getDate(),
            year = d.getFullYear();
    
        if (month.length < 2)  month = '0' + month;
        if (day.length < 2)  day = '0' + day;
    
        if(format==='YYYY/MM/DD')return [year, month, day].join(divider);
        else return [month, day,year].join(divider);
    }

    return (
        <GlobalContext.Provider value={{
            account, setAccount, accountVisible, setAccountVisible, showAccountPopUp, newAccount,
            contact, setContact, contactVisible, setContactVisible, showContactPopUp, newContact,
            driver, setDriver, driverVisible, setDriverVisible, showDriverPopUp, newDriver,
            material, setMaterial, materialVisible, setMaterialVisible, showMaterialPopUp, newMaterial,
            truck, setTruck, truckVisible, setTruckVisible, showTruckPopUp, newTruck,
            trailer, setTrailer, trailerVisible, setTrailerVisible, showTrailerPopUp, newTrailer,
            truckType, setTruckType, truckTypeVisible, setTruckTypeVisible, showTruckTypePopUp, newTruckType,
            location, setLocation, locationVisible, setLocationVisible, showLocationPopUp, newLocation,
            nameObject, nameType, nameVisible, setNameVisible, showNamePopUp, newDefaultName, newCapability,
            imageURL, imageRef, showImagePopUp, formatDate, options, setOptions
        }}>
            {children}
        </GlobalContext.Provider>
    );
};
export const useGlobal= () => useContext(GlobalContext);