import {useState,useEffect,type Dispatch,type SetStateAction} from 'react';
import {emptySave,normalizeSave,type Save} from './progress';
const KEY='khanfarris-shiftfall-v1';
export function useProgress(profile?: Save){
 const [save,setSave]=useState<Save>(emptySave),[ready,setReady]=useState(false),[status,setStatus]=useState('Loading browser save…');
 useEffect(()=>{if(profile){setSave(profile);setStatus('khanfarris profile · read-only published snapshot');setReady(true);return;}try{const raw=localStorage.getItem(KEY);if(raw)setSave(normalizeSave(JSON.parse(raw)));setStatus('Saved in this browser · download backups regularly');}catch{setStatus('Could not load browser save. Restore your downloaded backup.');}setReady(true);},[]);
 useEffect(()=>{if(!ready||profile)return;try{localStorage.setItem(KEY,JSON.stringify(save));setStatus('Saved in this browser · download backups regularly');}catch{setStatus('Browser save failed — download a backup before closing.');}},[save,ready]);
 return {save:profile||save,setSave:(profile?()=>{}:setSave) as Dispatch<SetStateAction<Save>>,ready,status};
}
