import {common} from './common.js';
export default {
 ...common,
 informazioni:common.informazioni.map(f=>f[0]==='nome'?['nome','Nome del locale']:f),
 caratteristiche:[['tipo_cucina','Cucina (una voce per riga)','list'],['specialita','Specialità (una per riga)','list'],['coperti_interni','Coperti al chiuso','number'],['coperti_esterni','Coperti all’aperto','number'],['periodo_apertura','Periodo di apertura'],['orari_apertura','Orari di apertura'],['giorni_chiusura','Giorni di chiusura'],['menu_url','Link al menu','url'],['prenotazione_consigliata','Prenotazione consigliata','tri'],['animali_ammessi','Animali ammessi','tri'],['accessibile','Accessibilità','tri'],['adatto_famiglie','Adatto alle famiglie','tri'],['aperto_tutto_anno','Aperto tutto l’anno','tri']]
};
