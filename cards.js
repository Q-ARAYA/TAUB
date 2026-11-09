// Agrega tarjetas con números únicos. Solo lo que está entre llaves forma el secreto.
export const cards = [
 {numero:1,mensaje:'{T}e ves súper preciosa hoy.',ilustracion:'corazon'},
 {numero:2,mensaje:'Amo v{E}rte sonreír.',ilustracion:'flor',separadorDespuesDeLetra:true},
 {numero:3,mensaje:'Linda, como las {A}bejitas del Minecraft.',ilustracion:'abejas',palabrasEstilo:[{palabra:'Minecraft',fuente:'pixel'}]},
 {numero:4,mensaje:'{M}ereces todo lo bonito del mundo.',ilustracion:'estrellas'},
 {numero:5,mensaje:'Eres fuerte y valiente c{O}mo Mérida.',ilustracion:'arco',separadorDespuesDeLetra:true,palabrasEstilo:[{palabra:'valiente',fuente:'valiente'},{palabra:'Mérida',fuente:'valiente'}]},
 {numero:6,mensaje:'Espero que tengas {U}n día hermoso, como esos colochos tuyos.',ilustracion:'sol'},
 {numero:7,mensaje:'{N}o sabes lo mucho que te amooooo.',ilustracion:'corazon',separadorDespuesDeLetra:true},
 {numero:8,mensaje:'{B}onita, como los atardeceres.',ilustracion:'atardecer'},
 {numero:9,mensaje:'Te amo como Carl amó a Ellie en {U}p.',ilustracion:'globos',palabrasEstilo:[{palabra:'Up',fuente:'up'}]},
 {numero:10,mensaje:'Aunque sé que puedes sola, siempre {E}staré para apoyarte.',ilustracion:'flor'},
 {numero:11,mensaje:'Quiero que seas mi mapachi{N}a.',ilustracion:'mapache'}
].map(c=>({imagen:null,palabrasEstilo:[],...c}));
