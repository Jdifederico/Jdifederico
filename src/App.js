import React, { useState } from 'react';
import { Route, Routes } from 'react-router-dom';
import Signin from './components/Signin';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import "@mobiscroll/react/dist/css/mobiscroll.min.css";
import '@mobiscroll/react4/dist/css/mobiscroll.min.css';
import "primereact/resources/primereact.min.css";
import "primereact/resources/themes/lara-light-indigo/theme.css";
import { AuthContextProvider } from './context/AuthContext';
import LoadingChecker from './components/LoadingChecker';

import MainContent from './components/MainContent'; // New component

function App(props) {
    const Sentry = props.Sentry;
    const [loading, setLoading] = useState(true);

    const handleLoadingChange = (loading) => { setLoading(loading); };

    return (
        <AuthContextProvider Sentry={Sentry}>
            <LoadingChecker onLoadingChange={handleLoadingChange} />
            <Routes>
                <Route path='/' element={<Signin />} />
            </Routes>
            <div id="recaptcha-container"></div>
            {!loading && ( <MainContent/> )}
           
        </AuthContextProvider>
    );
}

export default App;
