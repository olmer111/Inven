/**
 * Taxonomía completa de categorías para inventarios de múltiples tipos de negocio.
 * Los grupos existen solo para organizar la lista; en la app solo se ve el nombre
 * de la categoría una vez que un producto ha sido asignado a ella.
 */

export const TAXONOMIA_CATEGORIAS: Record<string, string[]> = {
  "Abarrotes y despensa": [
    "aceites y grasas",
    "arroz",
    "azúcar y endulzantes",
    "café y achicoria",
    "cereales y avenas",
    "chocolate y cocoa",
    "enlatados y conservas",
    "galletas y ponqués",
    "granos y legumbres",
    "harinas y mezclas",
    "miel y mermeladas",
    "pasta y fideos",
    "sal y especias",
    "salsas y aderezos",
    "snacks y pasabocas",
    "sopas y cremas instantáneas",
    "té e infusiones",
  ],
  "Bebidas": [
    "agua y hidratantes",
    "bebidas energizantes",
    "bebidas gaseosas",
    "cerveza",
    "jugos y néctares",
    "licores y aguardiente",
    "té y café listo",
    "vinos",
  ],
  "Lácteos y refrigerados": [
    "crema y mantequilla",
    "huevos",
    "leche",
    "quesos",
    "yogur y kumis",
    "productos refrigerados",
  ],
  "Carnes y proteínas": [
    "carnes de res",
    "carnes de cerdo",
    "embutidos y salchichas",
    "mariscos y pescados",
    "pollo y aves",
  ],
  "Frutas y verduras": [
    "frutas frescas",
    "hierbas aromáticas",
    "tubérculos y raíces",
    "verduras y hortalizas",
  ],
  "Panadería y repostería": [
    "arepas y tortillas",
    "ingredientes para repostería",
    "pan y bollería",
    "pasteles y tortas",
  ],
  "Droguería y farmacia": [
    "analgésicos y antipiréticos",
    "antibióticos",
    "antiinflamatorios",
    "antiparasitarios",
    "cremas tópicas y ungüentos",
    "equipos médicos y diagnóstico",
    "jarabes y soluciones orales",
    "medicamentos cardiovasculares",
    "medicamentos digestivos",
    "medicamentos fórmula médica",
    "primeros auxilios",
    "productos para bebé farmacia",
    "salud ósea y articular",
    "salud sexual y reproductiva",
    "suplementos vitamínicos",
    "vitaminas y minerales",
  ],
  "Higiene personal": [
    "champú y acondicionador",
    "cremas y lociones corporales",
    "desodorantes y antitranspirantes",
    "higiene femenina",
    "higiene íntima",
    "jabones y geles de baño",
    "maquillaje y cosméticos",
    "pasta dental y cepillos",
    "perfumes y colonias",
    "productos de afeitado",
    "protector solar y bronceador",
    "tintes y tratamientos capilares",
  ],
  "Hogar y limpieza": [
    "ambientadores y fragancias",
    "blanqueadores y cloros",
    "bolsas de basura",
    "ceras y lustres",
    "desinfectantes",
    "detergentes para ropa",
    "esponjas y fibras de limpieza",
    "insecticidas y repelentes",
    "limpiapisos y limpiadores",
    "papel higiénico y pañuelos",
    "servilletas y toallas de cocina",
    "suavizantes de ropa",
  ],
  "Ferretería y construcción": [
    "adhesivos y sellantes",
    "cables y materiales eléctricos",
    "cerraduras y herrajes",
    "herramientas eléctricas",
    "herramientas manuales",
    "materiales de construcción",
    "pinturas y diluyentes",
    "tuberías y plomería",
    "tornillos y fijaciones",
    "seguridad industrial",
  ],
  "Electrónica y tecnología": [
    "accesorios para computador",
    "audio y sonido",
    "baterías y pilas",
    "cables y adaptadores",
    "cámaras y fotografía",
    "celulares y accesorios",
    "electrodomésticos pequeños",
    "iluminación y lámparas",
    "relojes y wearables",
    "televisores y pantallas",
  ],
  "Papelería y oficina": [
    "bolígrafos y marcadores",
    "carpetas y archivadores",
    "cuadernos y libretas",
    "material escolar",
    "mochilas y maletines",
    "papel e impresión",
    "tijeras y pegantes",
  ],
  "Ropa y calzado": [
    "accesorios de moda",
    "calzado casual",
    "calzado deportivo",
    "gorras y sombreros",
    "medias y calcetines",
    "ropa femenina",
    "ropa infantil",
    "ropa interior y lencería",
    "ropa masculina",
    "uniformes y dotación",
  ],
  "Mascotas": [
    "accesorios para mascotas",
    "alimentos para gatos",
    "alimentos para perros",
    "higiene y cuidado de mascotas",
    "medicamentos veterinarios",
  ],
  "Bebé y niños": [
    "juguetes y entretenimiento",
    "leches de fórmula infantil",
    "pañales y toallitas húmedas",
    "papillas y alimentos de bebé",
    "ropa y accesorios de bebé",
  ],
  "Deporte y bienestar": [
    "equipos y accesorios deportivos",
    "nutrición deportiva",
    "suplementos para ejercicio",
    "ropa y calzado deportivo",
  ],
  "Decoración y cocina": [
    "almacenamiento y organización",
    "artículos de cocina",
    "cubiertos y vajillas",
    "decoración del hogar",
    "velas y aromaterapia",
  ],
};

/** Lista plana de todas las categorías, ordenadas alfabéticamente. */
export const TODAS_LAS_CATEGORIAS: string[] = Object.values(
  TAXONOMIA_CATEGORIAS
)
  .flat()
  .sort((a, b) => a.localeCompare(b, "es"));

/** Devuelve la categoría de la lista que mejor coincida con el texto dado,
 *  o "otros" si no hay una coincidencia razonable. */
export function normalizarCategoria(cat: string | null | undefined): string {
  if (!cat) return "otros";
  const c = cat.toLowerCase().trim();
  // coincidencia exacta
  const exacta = TODAS_LAS_CATEGORIAS.find((k) => k === c);
  if (exacta) return exacta;
  // la categoría contiene una de las conocidas
  const contiene = TODAS_LAS_CATEGORIAS.find((k) => c.includes(k));
  if (contiene) return contiene;
  // alguna conocida contiene la primera palabra de la categoría
  const primeraPalabra = c.split(/\s+/)[0];
  if (primeraPalabra.length > 3) {
    const parcial = TODAS_LAS_CATEGORIAS.find((k) => k.includes(primeraPalabra));
    if (parcial) return parcial;
  }
  return "otros";
}
