
import React from 'react';
import { Menubar } from 'primereact/menubar';
import { useNavigate } from 'react-router-dom';
import { useGlobal } from '../context/GlobalContext';

const TopMenuComponent = (props) => {
    const navigate = useNavigate();
    const { newAccount, newContact, newLocation, newMaterial, newTruckType, newDefaultName, newTruck, newTrailer, newCapability, options} = useGlobal();

    const itemRenderer = (item) => (
        <a
            className="flex align-items-center p-menuitem-link"
            onClick={(event) => {
                if (item.function) {
                    item.function(event); // Pass the event here
                } else if (item.url) {
                    navigate(item.url);
                }
            }}
            style={{ cursor: item.url || item.function ? 'pointer' : 'default' }}
        >
            <span className={item.icon} />
            <span className="mx-2">{item.label}</span>
            {item.shortcut && <span className="ml-auto border-1 surface-border border-round surface-100 text-xs p-1">{item.shortcut}</span>}
        </a>
    );
    const items = [
        
        {
            label: 'Jobs',
            icon: 'pi pi-mobile',
            items: [
                {
                    label: 'Jobs',
                    icon: 'pi pi-palette',
                    items: [
                        {
                            label: 'New',
                            icon: 'pi pi-palette',

                            template: itemRenderer
                        },
                        {
                            label: 'Search',
                            icon: 'pi pi-palette',
                            template: itemRenderer
                        }
                    ]
                }, {
                    label: 'Dispatches',
                    icon: 'pi pi-palette',
                    items: [
                        {
                            label: 'Calendar',
                            icon: 'pi pi-palette',
                            template: itemRenderer,
                            url: '/dispatch/home'
                        
                        },
                        {
                            label: 'Search',
                            icon: 'pi pi-palette',
                            template: itemRenderer
                        }
                    ]
                }, {
                    label: 'Prelims By Account',
                    icon: 'pi pi-envelope',
                    template: itemRenderer
                }
            ]
        },{
            label: 'Directory',
            icon: 'pi pi-search',
            items: [
                {
                    label: 'Accounts',
                    icon: 'pi pi-palette',
                    items: [
                        {
                            label: 'New',
                            icon: 'pi pi-palette',
                            template: itemRenderer,
                            function: newAccount
                        },
                        {
                            label: 'List',
                            icon: 'pi pi-palette',
                            template: itemRenderer,
                            url:'/accounts'
                        }
                    ]
                },
                {
                    label: 'Contacts',
                    icon: 'pi pi-palette',
                    items: [
                        {
                            label: 'New',
                            icon: 'pi pi-palette',
                            template: itemRenderer
                        },
                        {
                            label: 'List',
                            icon: 'pi pi-palette',
                            template: itemRenderer,
                             url:'/contacts'
                        }
                    ]
                },
                {
                    label: 'Locations',
                    icon: 'pi pi-palette',
                    items: [
                        {
                            label: 'New',
                            icon: 'pi pi-palette',
                            template: itemRenderer,
                            function: newLocation
                        },
                        {
                            label: 'List',
                            icon: 'pi pi-palette',
                            template: itemRenderer,
                              url:'/locations'
                        }
                    ]
                },
                {
                    label: 'Drivers',
                    icon: 'pi pi-palette',
                    items: [
                        {
                            label: 'New',
                            icon: 'pi pi-palette',
                            template: itemRenderer
                        },
                        {
                            label: 'List',
                            icon: 'pi pi-palette',
                            template: itemRenderer,   
                            url:'/drivers'
                        },
                        {
                            label: 'Priority',
                            icon: 'pi pi-palette',
                            template: itemRenderer,
                         
                        }
                    ]
                },
            ]
        },
        {
            label: 'Billing',
            icon: 'pi pi-clock',
            items: [
                {
                    label: 'Freight Bills',
                    icon: 'pi pi-palette',
                    items: [
                        {
                            label: 'Dashboard',
                            icon: 'pi pi-palette',
                            template: itemRenderer,
                            url:'freightbill/dashboard'
                        },
                        {
                            label: 'Search',
                            icon: 'pi pi-palette',
                            template: itemRenderer
                        }
                    ]
                },
                {
                    label: 'Invoices',
                    icon: 'pi pi-palette',
                    items: [
                        {
                            label: 'New',
                            icon: 'pi pi-palette',
                            url:'invoice/create',
                            template: itemRenderer
                        },
                        {
                            label: 'List',
                            icon: 'pi pi-palette',
                            url:'invoice/list',
                            template: itemRenderer
                        }
                    ]
                },
                {
                    label: 'Pay Statements',
                    icon: 'pi pi-palette',
                    items: [
                        {
                            label: 'New',
                            icon: 'pi pi-palette',
                            template: itemRenderer
                        },
                        {
                            label: 'List',
                            icon: 'pi pi-palette',
                            url:'paystatement/list',
                            template: itemRenderer
                        }
                    ]
                },
                {
                    label: 'Expense Names',
                    icon: 'pi pi-palette',
                    items: [
                        {
                            label: 'New',
                            icon: 'pi pi-palette',
                            template: itemRenderer,
                            function: () => newDefaultName('Expense')
                       
                        },
                        {
                            label: 'List',
                            icon: 'pi pi-palette',
                            template: itemRenderer,
                            url:"/expenses"
                        }
                    ]
                },
            ]
        },
        {
            label: 'Inventory',
            icon: 'pi pi-clock',
            items: [
                {
                    label: 'Trucks',
                    icon: 'pi pi-palette',
                    items: [
                        {
                            label: 'New',
                            icon: 'pi pi-palette',
                            template: itemRenderer,
                            function:newTruck
                        },
                        {
                            label: 'List',
                            icon: 'pi pi-palette',
                            template: itemRenderer,
                            url:"/trucks"
                        }
                    ]
                },
                {
                    label: 'Trailers',
                    icon: 'pi pi-palette',
                    items: [
                        {
                            label: 'New',
                            icon: 'pi pi-palette',
                            template: itemRenderer,
                            function:newTrailer
                        },
                        {
                            label: 'List',
                            icon: 'pi pi-palette',
                            template: itemRenderer,
                              url:"/trailers"
                        }
                    ]
                },
                {
                    label: 'Truck Types',
                    icon: 'pi pi-palette',
                    items: [
                        {
                            label: 'New',
                            icon: 'pi pi-palette',
                            template: itemRenderer,
                            function: newTruckType
                        },
                        {
                            label: 'List',
                            icon: 'pi pi-palette',
                            template: itemRenderer,
                            url:"/trucktypes"
                        }
                    ]
                },
                {
                    label: 'Materials',
                    icon: 'pi pi-palette',
                    items: [
                        {
                            label: 'New',
                            icon: 'pi pi-palette',
                            template: itemRenderer,
                            function: newMaterial
                        },
                        {
                            label: 'List',
                            icon: 'pi pi-palette',
                            template: itemRenderer,
                            url:"/materials"
                        }
                    ]
                },
            ]
        },
        {
            label: 'Miscellaneous',
            icon: 'pi pi-clock',
            items: [
                {
                    label: 'Compliance Names',
                    icon: 'pi pi-palette',
                    items: [
                     
                        {
                            label: 'Driver',
                            items:[
                                {
                                    label: 'New',
                                    icon: 'pi pi-palette',
                                    template: itemRenderer,
                                    function: () => newDefaultName('DriverCompliance')
                              
                                },
                                {
                                    label: 'List',
                                    icon: 'pi pi-palette',
                                    template: itemRenderer,
                                    url:'/compliancenames/driver'
                                },
                            ]
                        },
                        {
                            label: 'Truck',
                            items:[
                                {
                                    label: 'New',
                                    icon: 'pi pi-palette',
                                    template: itemRenderer,
                                    function: () => newDefaultName('TruckCompliance')
                              
                                },
                                    {
                                        label: 'List',
                                        icon: 'pi pi-palette',
                                        template: itemRenderer,
                                        url:'/compliancenames/truck'
                                    },
                            ]
                        },
                        {
                            label: 'Trailer',
                            items:[
                                {
                                    label: 'New',
                                    icon: 'pi pi-palette',
                                    template: itemRenderer,
                                    function: () => newDefaultName('TrailerCompliance')
                              
                                },
                                    {
                                        label: 'List',
                                        icon: 'pi pi-palette',
                                        template: itemRenderer,
                                        url:'/compliancenames/trailer'
                                    },
                            ]
                        },
                    ]
                },
                {
                    label: 'Compliances',
                    icon: 'pi pi-palette',
                    items: [
                     
                        {
                            label: 'Driver Compliances',
                            icon: 'pi pi-palette',
                            template: itemRenderer,
                            url:'/compliancenames/driver'
                        },
                        {
                            label: 'Truck Compliances',
                            icon: 'pi pi-palette',
                            template: itemRenderer
                          
                        },
                        {
                            label: 'Outside Driver Compliances',
                            icon: 'pi pi-palette',
                            template: itemRenderer,
                            
                        },
                     
                    ]
                },
                {
                    label: 'Capabilities',
                    icon: 'pi pi-palette',
                    items: [
                        {
                            label: 'New',
                            icon: 'pi pi-palette',
                            template: itemRenderer,
                            function: newCapability
                        },
                        {
                            label: 'List',
                            icon: 'pi pi-palette',
                            template: itemRenderer,
                             url:"/capabilities"
                        }
                    ]
                },
                {
                    label: 'Reports',
                    icon: 'pi pi-palette',
                    items: [
                        {
                            label: 'New',
                            icon: 'pi pi-palette',
                            template: itemRenderer
                        },
                        {
                            label: 'List',
                            icon: 'pi pi-palette',
                            template: itemRenderer
                        }, 
                        {
                            label: 'Jobs - Profit',
                            icon: 'pi pi-palette',
                            template: itemRenderer
                        }, 
                        {
                            label: 'Jobs - Prevailing Wage',
                            icon: 'pi pi-palette',
                            template: itemRenderer
                        }
                    ]
                },
            ]
        },  {
            label: 'Administration',
            icon: 'pi pi-clock',
            items: [
                {label: 'Tablets'},
                {label: 'Settings'},
                {label: 'Quickbooks'},
                {label: 'Logout'},
            ]
        }
    ];
    if(options){
  
        if(options.length){
            if(options.length>1){
                console.log('options B4= ', options)
                for(let q=0; q<options.length; q++){
                    if(!options[q].items)  options[q].template=itemRenderer;
                    else for(let k=0; k<options[q].items.length; k++)options[q].items[k].template=itemRenderer;
                } 
                
                items.push.apply(items, options);
            }else items.push(options[0]);
        }
        console.log('options  after= ', options)
    }
     

    
  return (
    <div className="card">
     <Menubar model={items} style={{padding:"0px"}} breakpoint="960px" />
</div>
  )
};

export default TopMenuComponent;