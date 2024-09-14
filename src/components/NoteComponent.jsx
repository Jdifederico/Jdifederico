import React, {useRef, useEffect, useState} from 'react';
import { Editor } from 'primereact/editor';


const NoteComponent = ({ parent, noteType,quillName, onNoteChange }) => {
    const noteRef = useRef(null)

    const [quillNotes, setQuillNotes] = useState(null);
    const [cursorPosition, setCursorPosition] = useState(null);
    const [quillInstance, setQuillInstance] = useState(null);
    const noteText = parent[noteType];
    const quillValue = parent[quillName];

   // console.log('quillNotes when loading ', quillNotes)
   const saveNotes = (e) => {
    if (noteRef.current) {
        const quillInstance = noteRef.current.getQuill();
        console.log('like wtf is the note cahgne = ', e)
        onNoteChange(noteType, e.textValue,quillName, quillInstance.editor.delta.ops);
    }
    
}; 
  



    function mapQuillAttributes( html, ops){
    
        let tag = "";
        let openTags =[];
        ops.forEach((op,index) => {
            const { insert, attributes } = op; 
            if (attributes) {
                Object.keys(attributes).forEach(attr => {
                if (attr === "bold") {
                    tag += "<strong>";
                    openTags.push("</strong>");
                } else if (attr === "italic") {
                    tag += "<em>";
                    openTags.push("</em>");
                } else if (attr === "underline") {
                    tag += "<u>";
                    openTags.push("</u>");
                } else if (attr === "color") {
                    tag += `<span style="color: ${attributes.color}">`;
                    openTags.push('</span>');
                } else if (attr === "background") {
                    tag += `<span style="background-color: ${attributes.background}">`;
                    openTags.push('</span>');
                }
                });
            }
        
            html += `${tag}${insert}${openTags.reverse().join('')}`;
            })
        return html;
        
    }
  
    function quillOpsToHtml(ops) {
        let html = "";
        let openTags = [];
        if(ops?.length>0){
            console.log('ops = ', ops)
            ops.forEach((op,index) => {
            const { insert, attributes } = op;

            if (insert.includes('\n')) {
                const insertParts = insert.split('\n');
                insertParts.forEach((part, i) => {
                    if (i === 0 && part)   html = `${mapQuillAttributes( html, [{ insert: part }])}`;
                    // Add opening and clsoing paragraph tag for new line
                    html+=`</p><p>`
                    if(i!=0 && part) html = `${mapQuillAttributes( html, [{ insert: part }])}`;
                });
            
            } else {
                html = `${mapQuillAttributes(html, [op])}`;
                if (index === ops.length - 1)  html += "</p>";   
                openTags = [];
            }
            });
            return html;
        }else return '';
       
    }
    const loadQuill = (e) => {
        setQuillNotes(quillOpsToHtml(quillValue))    
    }
    const renderHeader = () => {
        return (
            <span className="ql-formats">
                <button className="ql-bold" aria-label="Bold"></button>
                <button className="ql-italic" aria-label="Italic"></button>
                <button className="ql-underline" aria-label="Underline"></button>
                <select className="ql-color" aria-label="Color"></select>
                <select className="ql-background" aria-label="Background"></select>
            </span>
        );
    };
  
    const header = renderHeader();

    return (
        <div>
            <Editor  headerTemplate={header} text={noteText} value={quillNotes} onLoad={loadQuill} ref={noteRef} key={quillName} onTextChange={(e) => saveNotes(e)} style={{ height: '320px' }} />
        </div>
    );
};

export default NoteComponent;