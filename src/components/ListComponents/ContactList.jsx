import React from 'react';


const ContactList = ({ contact, onDeleteContact, onEditContact }) => {
  //  console.log(' NOTE ON LAOD = ', note);


    return (
        <tr className="mbsc-row" style={{ width: '100%', marginLeft: '1.1em',borderBottom:'1px solid #dee2e6'}}>
            <td style={{ width: '10%', padding: '0',   borderRight:'1px solid #dee2e6' }}>
                <button style={{ margin: '0', padding: '.5em', width:"95%" }}   onClick={(e) => onDeleteContact(contact)}    className="mbsc-ios mbsc-btn-primary mbsc-btn"    >  Delete  </button>
            </td>
            <td style={{ width: '10%', padding: '0',  borderRight:'1px solid #dee2e6' }}>
                <button style={{ margin: '0', padding: '.5em', width:"95%" }}   onClick={(e) => onEditContact(contact)}    className="mbsc-ios mbsc-btn-primary mbsc-btn"    >  Edit  </button>
            </td>
            <td style={{ width: '15%', padding: '0', paddingLeft:'1em',  borderRight:'1px solid #dee2e6' }}> {contact.Name} </td>
            <td style={{ width: '15%', padding: '0',paddingLeft:'1em',  borderRight:'1px solid #dee2e6' }}> {contact.displayPhone} </td>
    
            <td style={{ width: '25%', padding: '0', paddingLeft:'1em',  borderRight:'1px solid #dee2e6' }}> {contact.Email} </td>
            <td style={{ width: '25%', padding: '0', paddingLeft:'1em', borderRight:'1px solid #dee2e6' }}> {contact.Department} </td>
        </tr>
    );
};

export default ContactList;