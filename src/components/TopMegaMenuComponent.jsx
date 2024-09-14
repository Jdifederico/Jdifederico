
import React from 'react';
import { MegaMenu } from 'primereact/megamenu';
import { Menubar } from 'primereact/menubar';

import { Badge } from 'primereact/badge';

const TopMegaMenuComponent = (props) => {


    const items = [
        
        {
            label: 'Jobs',
            icon: 'pi pi-mobile',
            items: [
                [{
                        label: 'Jobs/Dispatches',
                        items: [{ label: 'New' }, { label: 'Search' }]
                }],
                [{
                    label: 'Dispatches',
                    items: [{ label: 'Calendar' },{ label: 'Search' }]
            }],
                [{
                        label: 'Preliminary Notices',
                        items: [{ label: 'List By Account'}]
                    }]
               
            ]
        },
       {
            label: 'Directory',
            icon: 'pi pi-box',
            items: [
                [{
                        label: 'Accounts',
                        items: [{ label: ' New' }, { label: ' List' }]
                }],
                [{
                    label: 'Contacts',
                    items: [{ label: 'New' }, { label: 'List' }]
                }],
                [{
                    label: 'Locations',
                    items: [{ label: ' New' }, { label: ' List' }]
                }],
                [{
                    label: 'Drivers',
                    items: [{ label: 'New' }, { label: 'List' }, { label: 'Priority'}]
                }],
            ]
        },
       
        {
            label: 'Billing',
            icon: 'pi pi-clock',
            items: [
                [{
                    label: 'Freight Bills',
                    items: [{ label: 'Dashboard' }, { label: 'Search' }]
                }],
                [{
                    label: 'Invoices',
                    items: [{ label: 'Invoices - New' }, { label: 'Invoices - List' }]
                }],
                [{
                    label: 'Pay Statements',
                    items: [{ label: 'Pay Statements - New' }, { label: 'Pay Statements - List' }]
                }],
                [{
                    label: 'Expense Names',
                    items: [{ label: 'Expense Names - New' }, { label: 'Expense Names - List' }]
                }],
            ]
        }
    ];

    
  return (
    <div className="card">
     <MegaMenu model={items} breakpoint="960px" />
</div>
  )
};

export default TopMegaMenuComponent;