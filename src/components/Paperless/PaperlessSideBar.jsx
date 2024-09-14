import React, { useState } from 'react';

import { Sidebar } from 'primereact/sidebar';
import { Button } from 'primereact/button';
import { Menu } from 'primereact/menu';


const PaperlessSideBar = (props) => {
    const logout= props.logout;
    const [visible, setVisible] = useState(false);

    const items = [
        {
            label: 'Navigate',
            items: [
                {
                    label: 'Logout',
                    command: () => {
                    logout();
                    setVisible(false);
                    }
                },
              
            ]
        }
    ];
  return (
    <div>     

    <Sidebar visible={visible} onHide={() => setVisible(false)}>
    <Menu model={items}  />
    </Sidebar>
<Button style={{width:"100%", textAlign:"left"}} icon="pi pi-bars" onClick={() => setVisible(true)} />
</div>
  )
}

export default PaperlessSideBar