import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, deleteDoc, getDocs, collection } from "firebase/firestore";
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

async function fixReviews() {
  console.log("Updating Firestore reviews to match user's actual latest data...");

  // Load reviews from computer
  const compReviews = JSON.parse(
    fs.readFileSync("C:/Users/TEFA/.gemini/antigravity/brain/df5d6d9f-9f5c-4668-bedf-0a011e35c968/scratch/user_computer_reviews.json", "utf8")
  );

  // Overwrite/set all real reviews from user computer (R01..R09)
  for (const r of compReviews) {
    await setDoc(doc(db, "reviews", r.id), clean(r));
    console.log("Updated/Set doc:", r.id, r.customerName);
  }

  // Delete obsolete test reviews (R11, R12, R13, R14)
  for (const oldId of ["R11", "R12", "R13", "R14"]) {
    await deleteDoc(doc(db, "reviews", oldId));
    console.log("Deleted obsolete doc:", oldId);
  }

  // Check final reviews in Firestore
  const snap = await getDocs(collection(db, "reviews"));
  console.log("Final Firestore reviews count:", snap.docs.length);
  const finalReviews = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  finalReviews.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  finalReviews.forEach(r => console.log(r.id, r.customerName, r.date, r.adminReply ? "REPLIED: " + r.adminReply : "NO_REPLY"));
}

fixReviews().catch(console.error);
