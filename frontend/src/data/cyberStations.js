const cyberStations = [
{
  city: "Delhi",
  label: "Cyber Crime Police Station (Mandir Marg)",
  lat: 28.6353,
  lng: 77.2100,
  phone: "011-23361880",
  address: "Cyber Police Station, PS Mandir Marg, New Delhi - 110001",
  url: "https://www.google.com/maps/place/Mandir+Marg+Police+Station"
},

{
  city: "Mumbai",
  label: "Cyber Police Station Mumbai",
  lat: 19.0760,
  lng: 72.8777,
  phone: "022-26504000",
  address: "Cyber Police Station, BKC, Bandra East, Mumbai, Maharashtra",
  url: "https://www.google.com/maps/place/BKC+Mumbai"
},

{
  city: "Chennai",
  label: "Cyber Crime Police Station Chennai",
  lat: 13.0827,
  lng: 80.2707,
  phone: "044-28447701",
  address: "CB-CID Headquarters, Pantheon Rd, Egmore, Chennai, Tamil Nadu",
  url: "https://www.google.com/maps/place/CB-CID+Headquarters+Chennai"
},

{
  city: "Hyderabad",
  label: "Cyber Crimes Police Station",
  lat: 17.3995,
  lng: 78.4763,
  phone: "8712665171",
  address: "Central Crime Station Building, Basheerbagh, Hyderabad, Telangana - 500029",
  url: "https://www.google.com/maps/place/Basheerbagh+Hyderabad"
},

// ---------------- BENGALURU ----------------

{
  city: "Bengaluru",
  label: "CID Cyber Crime Police Station",
  lat: 12.981866,
  lng: 77.585428,
  phone: "080-22094498",
  address: "CID Annexe Building, Carlton House, Palace Rd, Bengaluru, Karnataka",
  url: "https://www.google.com/maps/place/Carlton+House+Bangalore"
},

{
  city: "Bengaluru",
  label: "Cyber Crime Police Station (Malleshwaram)",
  lat: 13.0196,
  lng: 77.5660,
  phone: "080-22094498",
  address: "2H95+694, 8th Main Rd, IISc Gymnasium, Malleshwaram, Bengaluru, Karnataka 560012",
  url: "https://www.google.com/maps/place/2H95%2B694+Bengaluru"
},

{
  city: "Bengaluru",
  label: "Cyber Crime Police Station (Basaveshwar Nagar)",
  lat: 12.9918,
  lng: 77.5389,
  phone: "080-22094498",
  address: "XGQP+5XP, West of Chord Road 3rd Stage, Basaveshwar Nagar, Bengaluru, Karnataka 560079",
  url: "https://www.google.com/maps/place/XGQP%2B5XP+Bengaluru"
},

{
  city: "Bengaluru",
  label: "Cyber Crime Police Station (Shivaji Nagar)",
  lat: 12.9847,
  lng: 77.6031,
  phone: "080-22094498",
  address: "Police Station, 1st Floor, above Shivajinagara, Sulthangunta, Shivaji Nagar, Bengaluru, Karnataka 560051",
  url: "https://www.google.com/maps/place/Shivaji+Nagar+Bengaluru"
},

// ---------------- OTHER KARNATAKA ----------------

{
  city: "Mysuru",
  label: "Cyber Economic & Narcotics Police Station (CEN)",
  lat: 12.2958,
  lng: 76.6394,
  phone: "0821-2418300",
  address: "Mysuru City Police Commissioner Office, Nazarbad, Mysuru, Karnataka",
  url: "https://www.google.com/maps/place/Mysuru+City+Police+Office"
},

{
  city: "Mangaluru",
  label: "Cyber Crime Police Station Mangaluru",
  lat: 12.9141,
  lng: 74.8560,
  phone: "0824-2220800",
  address: "Police Commissioner Office, Pandeshwar, Mangaluru, Karnataka",
  url: "https://www.google.com/maps/place/Mangalore+Police+Commissioner+Office"
},

{
  city: "Hubballi",
  label: "Cyber Crime Police Station Hubballi-Dharwad",
  lat: 15.3647,
  lng: 75.1240,
  phone: "0836-2233444",
  address: "Hubballi-Dharwad Police Commissioner Office, Hubballi, Karnataka",
  url: "https://www.google.com/maps/place/Hubli+Police"
},

{
  city: "Belagavi",
  label: "Cyber Crime Police Station Belagavi",
  lat: 15.8497,
  lng: 74.4977,
  phone: "0831-2405200",
  address: "District Police Office, Belagavi, Karnataka",
  url: "https://www.google.com/maps/place/Belgaum+Police"
},

{
  city: "Kalaburagi",
  label: "Cyber Crime Police Station Kalaburagi",
  lat: 17.3297,
  lng: 76.8343,
  phone: "08472-256600",
  address: "District Police Office, Kalaburagi, Karnataka",
  url: "https://www.google.com/maps/place/Gulbarga+Police"
},

{
  city: "Shivamogga",
  label: "Cyber Crime Police Station Shivamogga",
  lat: 13.9299,
  lng: 75.5681,
  phone: "08182-271400",
  address: "District Police Office, Shivamogga, Karnataka",
  url: "https://www.google.com/maps/place/Shimoga+Police"
},

{
  city: "Tumakuru",
  label: "Cyber Crime Police Station Tumakuru",
  lat: 13.3409,
  lng: 77.1010,
  phone: "0816-2274000",
  address: "District Police Office, Tumakuru, Karnataka",
  url: "https://www.google.com/maps/place/Tumkur+Police"
},

{
  city: "Udupi",
  label: "Cyber Crime Police Station Udupi",
  lat: 13.3409,
  lng: 74.7421,
  phone: "0820-2526444",
  address: "District Police Office, Udupi, Karnataka",
  url: "https://www.google.com/maps/place/Udupi+Police"
},

// ---------------- OTHER MAJOR CITIES ----------------

{
  city: "Kolkata",
  label: "Cyber Crime Police Station Kolkata",
  lat: 22.5726,
  lng: 88.3639,
  phone: "033-22143526",
  address: "Lalbazar Police Headquarters, Kolkata, West Bengal",
  url: "https://www.google.com/maps/place/Lalbazar+Kolkata"
},

{
  city: "Pune",
  label: "Cyber Police Station Pune",
  lat: 18.5204,
  lng: 73.8567,
  phone: "020-26122880",
  address: "Cyber Police Station, Shivajinagar, Pune, Maharashtra",
  url: "https://www.google.com/maps/place/Shivajinagar+Pune"
},

{
  city: "Ahmedabad",
  label: "Cyber Crime Police Station Ahmedabad",
  lat: 23.0225,
  lng: 72.5714,
  phone: "079-23251900",
  address: "Cyber Crime Police Station, Shahibaug, Ahmedabad, Gujarat",
  url: "https://www.google.com/maps/place/Shahibaug+Ahmedabad"
},

{
  city: "Jaipur",
  label: "Cyber Crime Police Station Jaipur",
  lat: 26.9124,
  lng: 75.7873,
  phone: "0141-2741035",
  address: "Cyber Crime Police Station, Jaipur Commissionerate, Rajasthan",
  url: "https://www.google.com/maps/place/Jaipur+Police+Commissionerate"
},

{
  city: "Lucknow",
  label: "Cyber Crime Police Station Lucknow",
  lat: 26.8467,
  lng: 80.9462,
  phone: "0522-2614700",
  address: "Cyber Crime Police Station, Hazratganj, Lucknow, Uttar Pradesh",
  url: "https://www.google.com/maps/place/Hazratganj+Lucknow"
},

{
  city: "Chandigarh",
  label: "Cyber Crime Police Station Chandigarh",
  lat: 30.7333,
  lng: 76.7794,
  phone: "0172-2749194",
  address: "Cyber Cell, Sector 17, Chandigarh",
  url: "https://www.google.com/maps/place/Sector+17+Chandigarh"
},

{
  city: "Bhopal",
  label: "Cyber Crime Police Station Bhopal",
  lat: 23.2599,
  lng: 77.4126,
  phone: "0755-2551191",
  address: "Cyber Crime Police Station, Bhopal, Madhya Pradesh",
  url: "https://www.google.com/maps/place/Bhopal+Police"
}

];

export default cyberStations;