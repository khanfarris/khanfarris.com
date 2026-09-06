import {useState,useEffect,type Dispatch,type SetStateAction} from 'react';
import {emptySave,normalizeSave,type Save} from './progress';
const KEY='khanfarris-shiftfall-v1';
export function useProgress(){
 const [save,setSave]=useState<Save>(emptySave),[ready,setReady]=useState(false),[status,setStatus]=useState('Loading browser save…');
 useEffect(()=>{try{const raw=localStorage.getItem(KEY);if(raw)setSave(normalizeSave(JSON.parse(raw)));setStatus('Saved in this browser · download backups regularly');}catch{setStatus('Could not load browser save. Restore your downloaded backup.');}setReady(true);},[]);
 useEffect(()=>{if(!ready)return;try{localStorage.setItem(KEY,JSON.stringify(save));setStatus('Saved in this browser · download backups regularly');}catch{setStatus('Browser save failed — download a backup before closing.');}},[save,ready]);
 return {save,setSave:setSave as Dispatch<SetStateAction<Save>>,ready,status,loadCloud:async()=>{}};
}
