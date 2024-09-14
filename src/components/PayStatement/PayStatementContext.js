
import React, {useState,useContext,useRef, createContext,useCallback} from 'react'

import { db } from '../../firebase';
import { doc,  query,getDoc, collection, addDoc, setDoc, onSnapshot, where } from 'firebase/firestore';

import { UserAuth } from '../../context/AuthContext';
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';

const PayStatementContext = createContext();
export const PayStatementContextProvider = ({ children }) => {
    const {gearedUser }= UserAuth();
    const [payStatements, setPayStatements]= useState(null);
    const [payStatement, setPayStatement]= useState(null)
    const [payStatementBisible, setPayStatementVisible]= useState(false)
    const payStatementRef = useRef(null);
    const payStatementsRef = useRef(null);
    console.log('pay statement context reload')
    return (
        <PayStatementContext.Provider value={{
           payStatementRef,setPayStatements,setPayStatement, payStatementsRef,setPayStatementVisible
        }}>
            {children}
        </PayStatementContext.Provider>
    );
}
    export const usePayStatement= () => {
        return useContext(PayStatementContext);
    };
