import {common} from './common.js';
export default {
 ...common,
 informazioni:common.informazioni.map(f=>f[0]==='nome'?['nome','Nome struttura']:f),
 caratteristiche:[['numero_camere','Camere','number'],['posti_letto','Posti letto','number'],['periodo_apertura','Periodo di apertura'],['check_in','Check-in','time'],['check_out','Check-out','time'],['tipologie_camere','Tipologie di camere (una per riga)','list'],['trattamenti_disponibili','Trattamenti (uno per riga)','list'],['ideale_per','Ideale per (uno per riga)','list'],['animali_ammessi','Animali ammessi','tri'],['accessibile','Accessibilità','tri'],['adatto_famiglie','Adatto alle famiglie','tri'],['aperto_tutto_anno','Aperta tutto l’anno','tri']]
};
