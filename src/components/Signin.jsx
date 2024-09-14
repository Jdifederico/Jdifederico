import React, {useState, useEffect} from 'react'
import {  useNavigate } from 'react-router-dom'
import { UserAuth } from '../context/AuthContext';
import {RecaptchaVerifier } from "firebase/auth"; 
import { auth } from '../firebase';
import VerificationInput from "react-verification-input";
import { Card } from 'primereact/card';
import  { Input, Page,  Button } from '@mobiscroll/react';
import '@mobiscroll/react4/dist/css/mobiscroll.min.css';
import mobiscroll from '@mobiscroll/react4';
import "@mobiscroll/react/dist/css/mobiscroll.min.css";
const Signin = () => {
  
  const { loginWithConfirmationCode } = UserAuth();
  const {signIn, user} = UserAuth();


  const [confirmationCode, setConfirmationCode] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [optIn, setOptIn] = useState(true);

  const [showConfirmation, setShowConfirmation] = useState(false);

  const navigate = useNavigate()
  var confirmationPromise;

  useEffect(()=>{
    console.log('user hello', user);
    if(user) return  navigate('/home'); 

},[user])







function onSignInSubmit() {
    
  console.log('email = ',email);
  console.log('password = ',password);
  confirmationPromise = signIn(email,password);
  confirmationPromise.then((confirmationRes) => {
    // SMS sent. Prompt user to type the code from the message, then sign the
    // user in with confirmationResult.confirm(code).

 
  }).catch((error) => {

    console.log('error = ', error);
    return 0;
  });

}

const changeEmail = (e)=>{
    let email = e.target.value;
    setEmail(email);
}

const changePassword = (e)=>{
  let password= e.target.value;
  console.log('e = ', e)
  setPassword(password);
}
  const handleSubmit = async(e)=>{
    e.preventDefault();
   
 

      try{

         await onSignInSubmit();
          
      }catch(e){
        
          console.log(e);
      }
 
}
const cancelSignIn = () =>{
  setShowConfirmation(false)
  console.log('ok wtf no one clicked this why is it running?!?!?!')
/*
     <Checkbox  onChange={e => setOptIn(e.checked)} checked={optIn} ></Checkbox>
            
    
            <label  className="ml-2"  style={{paddingLeft:".5em"}}>   
              I agree to receive notification messaging from Alianza Technologies at the phone number provided above. 
              I understand that I will receieve messages when notified, data rates may apply, reply STOP  to opt out
             </label>
             */
}


  return ( 
    <Page>
      <div className="mbsc-grid mbsc-justify-content-center "  style={{padding:"0"}}> 
      <div className="mbsc-col-sm-12 mbsc-col-lg-6  mbsc-offset-lg-3">
        <Card style={{ paddingLeft:'1em',paddingRight:'1em'}} >  
          <mobiscroll.CardHeader>
                <mobiscroll.CardTitle style={{ textAlign: 'center',fontSize: '30px'}}>Alianza Technologies</mobiscroll.CardTitle>
                {showConfirmation ? (     <mobiscroll.CardSubtitle style={{ textAlign: 'center',fontSize: '15px'}}>   Sign in for Alianza Technologies </mobiscroll.CardSubtitle>):(<div></div>)}
             
          </mobiscroll.CardHeader>
          <div className="mbsc-form-group">
        
             <React.Fragment>
              <div className="p-inputgroup"   style={{paddingBottom:"1em"}}>
                <span className="p-inputgroup-addon"  style={{width:"40%"}}>Email:</span> 
                <Input  onChange={(e) => changeEmail(e)} />
              </div>
              <div className="p-inputgroup"   style={{paddingBottom:"1em"}}>
                <span className="p-inputgroup-addon"  style={{width:"40%"}}>Password:</span> 
                <Input  onChange={(e) => changePassword(e)} />
              </div>
              <Button id="send-text-button" color="primary" onClick={handleSubmit} style={{ paddingBottom: "1em", paddingTop: "1em"}}>Sign In</Button>
          
              </React.Fragment>
            
          </div>
        
        </Card  >
        </div>
    </div>
  </Page>
)



}

export default Signin