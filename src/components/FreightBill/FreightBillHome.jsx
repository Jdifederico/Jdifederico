import React, { useEffect } from 'react';

import { UserAuth } from '../../context/AuthContext';
import FreightBillCalendar from './FreightBillCalendar';
import { Panel } from 'primereact/panel';
import { useFreightBill } from './FreightBillContext';
import DispatchList from './DispatchList';

export default function FreightBillHome() {
    const { homeDate, homeFreightBills, homeDispatches, homeExpenses,freightBillIDRef, setFreightBill, setFreightBillState } = useFreightBill();
    const { gearedUser } = UserAuth();



    if (!gearedUser) {
        return <div>Loading...</div>;
    } else if (gearedUser.selectedOrgName) {
        const sortedDispatches = [...homeDispatches.filter(item => item.QueryDate === homeDate)].sort((a, b) => {
            const timeA = a.StartTime ? new Date(`1970-01-01T${a.StartTime}:00`) : null;
            const timeB = b.StartTime ? new Date(`1970-01-01T${b.StartTime}:00`) : null;
            if (timeA && timeB)  return timeA - timeB;
            else if (timeA)   return -1;
            else if (timeB) return 1;
            else  return 0;
            
        });

        return (
            <div className="mbsc-grid" style={{ padding: "0" }}>
                <div className="mbsc-row" style={{ margin: "0" }}>
                    <div className="mbsc-col-lg-7 mbsc-col-12" style={{ padding: "0", paddingRight: ".5em" }}>
                        <FreightBillCalendar />
                    </div>
                    <div className="mbsc-col-lg-5 mbsc-col-12" style={{ padding: "0", paddingLeft: ".25em" }}>
                        <Panel header="Dispatches">
                            {sortedDispatches.map((item, index) => {
                                const originalIndex = homeDispatches.findIndex(dispatch => dispatch.ID === item.ID);
                                return (
                                    <DispatchList key={item.ID} dispatch={{ item }} homeFreightBills={homeFreightBills} homeExpenses={homeExpenses} freightBillIDRef={freightBillIDRef} originalIndex={originalIndex} />
                                );
                            })}
                        </Panel>
                    </div>
                </div>
            </div>
        );
    }
}
