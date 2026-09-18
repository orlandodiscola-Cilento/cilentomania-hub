import accommodation from './schemas/accommodation.js';
import restaurant from './schemas/restaurant.js';
// A type belongs to a listing, never to a user or organization.
export const CONTENT_TYPES = Object.freeze({
 accommodation:{label:'Struttura ricettiva',ready:true,sections:accommodation,categoryOptions:['Hotel','Boutique hotel','B&B','Affittacamere','Agriturismo','Casa vacanza','Appartamento turistico','Residence','Resort','Villaggio turistico','Camping','Glamping','Ostello','Rifugio'],services:{wifi:'Wi-Fi',pool:'Piscina',parking:'Parcheggio',breakfast:'Colazione',air_conditioning:'Aria condizionata',sea_view:'Vista mare',pets:'Animali ammessi',accessible:'Accessibilità',spa:'SPA',restaurant:'Ristorante'}},
 restaurant:{label:'Ristorazione',ready:true,sections:restaurant,categoryOptions:['Ristorante','Trattoria','Osteria','Pizzeria','Ristorante pizzeria','Braceria','Paninoteca','Pub','Birreria','Enoteca','Wine bar','Bar','Caffetteria','Pasticceria','Gelateria','Tavola calda','Rosticceria','Gastronomia','Agriturismo con ristorazione','Street food'],services:{wifi:'Wi-Fi',parking:'Parcheggio',air_conditioning:'Aria condizionata',sea_view:'Vista mare',pets:'Animali ammessi',accessible:'Accessibilità',outdoor_seating:'Tavoli all’aperto',vegetarian_options:'Opzioni vegetariane',vegan_options:'Opzioni vegane',gluten_free_options:'Opzioni senza glutine',takeaway:'Asporto',high_chairs:'Seggioloni'}},
 experience:{label:'Esperienze ed escursioni',ready:false},
 event:{label:'Eventi',ready:false},
 service:{label:'Servizi',ready:false,categories:{beach_club:{label:'Stabilimento balneare',ready:false,plannedFields:['beach_type','umbrellas','sunbeds','showers','changing_rooms','accessible_beach','lifeguard','beach_bar','opening_period','booking_url']}}},
 itinerary:{label:'Itinerari',ready:false}
});
export function contentType(type='accommodation') {
 const result=CONTENT_TYPES[type];
 if(!result?.ready)throw Error('Questo tipo di scheda non è ancora disponibile.');
 return result;
}
// Commercial configuration is private, per listing, and not an entitlement.
// Unknown values never imply an active subscription or permission to publish.
export function emptyAdministration(listingId) {
 return {listingId,billingUnit:'listing',planId:null,subscriptionId:null,status:null,startsAt:null,expiresAt:null,renewalAt:null,contract:null,payment:null};
}
