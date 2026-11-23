import { initializeApp } from "firebase/app";
import { getFirestore, collection, doc, setDoc, getDocs } from "firebase/firestore";
import fs from "node:fs";

const firebaseConfig = {
  apiKey: "AIzaSyAQ7JJkh1Zb2EU63KXawSfU2uhHZ5gqLV4",
  authDomain: "webwarung-hailai.firebaseapp.com",
  projectId: "webwarung-hailai",
  storageBucket: "webwarung-hailai.firebasestorage.app",
  messagingSenderId: "260787210326",
  appId: "1:260787210326:web:4a756dc3f22a2a3f7753f7"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const clean = (val) => JSON.parse(JSON.stringify(val));

async function syncAllToFirestore() {
  console.log("Starting full push to Firestore...");

  // 1. Employees (8 employees)
  const perfect = JSON.parse(fs.readFileSync("C:/Users/TEFA/.gemini/antigravity/brain/df5d6d9f-9f5c-4668-bedf-0a011e35c968/scratch/extracted_perfect.json", "utf8"));
  const employees = perfect["hailai.employees.v2"];
  for (const emp of employees) {
    await setDoc(doc(db, "employees", emp.id), clean(emp));
  }
  console.log("Synced", employees.length, "employees to Firestore.");

  // 2. ProductLogs (10 logs)
  const plogs = JSON.parse(fs.readFileSync("C:/Users/TEFA/.gemini/antigravity/brain/df5d6d9f-9f5c-4668-bedf-0a011e35c968/scratch/extracted_productLogs.json", "utf8"));
  for (const log of plogs) {
    await setDoc(doc(db, "productLogs", log.id), clean(log));
  }
  console.log("Synced", plogs.length, "productLogs to Firestore.");

  // 3. Transactions (24 transactions)
  const trxs = JSON.parse(fs.readFileSync("C:/Users/TEFA/.gemini/antigravity/brain/df5d6d9f-9f5c-4668-bedf-0a011e35c968/scratch/extracted_transactions.json", "utf8"));
  for (const trx of trxs) {
    await setDoc(doc(db, "transactions", trx.id), clean(trx));
  }
  console.log("Synced", trxs.length, "transactions to Firestore.");

  // 4. Products (54 products)
  const products = perfect["hailai.products.v2"];
  for (const p of products) {
    await setDoc(doc(db, "products", p.id), clean(p));
  }
  console.log("Synced", products.length, "products to Firestore.");

  // 5. Reviews - fetch existing and merge
  const rSnap = await getDocs(collection(db, "reviews"));
  const existingR = new Map(rSnap.docs.map(d => [d.id, d.data()]));
  const localR = perfect["hailai.reviews.v2"];
  for (const r of localR) {
    if (!existingR.has(r.id)) {
      await setDoc(doc(db, "reviews", r.id), clean(r));
    }
  }
  console.log("Synced reviews to Firestore.");

  console.log("ALL DATA SUCCESSFULLY SYNCED TO FIRESTORE!");
}

syncAllToFirestore().catch(console.error);
