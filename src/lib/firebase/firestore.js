// Import fake restaurant seed data.
import { generateFakeRestaurantsAndReviews } from "@/src/lib/fakeRestaurants.js";

// Import the Firestore helpers.
import {
  collection,
  onSnapshot,
  query,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  orderBy,
  Timestamp,
  runTransaction,
  where,
  addDoc,
  getFirestore,
} from "firebase/firestore";

// Import the shared Firestore instance.
import { db } from "@/src/lib/firebase/clientApp";

// Update a restaurant image reference.
export async function updateRestaurantImageReference(
  restaurantId,
  publicImageUrl
) {
  // Create the document reference.
  const restaurantRef = doc(collection(db, "restaurants"), restaurantId);
  // Save the updated image URL.
  if (restaurantRef) {
    await updateDoc(restaurantRef, { photo: publicImageUrl });
  }
}

// Define the rating update helper.
const updateWithRating = async (
  transaction,
  docRef,
  newRatingDocument,
  review
) => {
  // This helper is currently a stub.
  return;
};

// Add a review to a restaurant.
export async function addReviewToRestaurant(db, restaurantId, review) {
  // This function is intentionally not implemented yet.
  return;
}

// Apply any requested filters to a query.
function applyQueryFilters(q, { category, city, price, sort }) {
  if (category) {
    q = query(q, where("category", "==", category));
  }
  if (city) {
    q = query(q, where("city", "==", city));
  }
  if (price) {
    q = query(q, where("price", "==", price.length));
  }
  if (sort === "Rating" || !sort) {
    q = query(q, orderBy("avgRating", "desc"));
  } else if (sort === "Review") {
    q = query(q, orderBy("numRatings", "desc"));
  }
  return q;
}

export async function getRestaurants(db = db, filters = {}) {
  let q = query(collection(db, "restaurants"));

  q = applyQueryFilters(q, filters);
  const results = await getDocs(q);
  return results.docs.map((doc) => {
    return {
      id: doc.id,
      ...doc.data(),
      // Only plain objects can be passed to Client Components from Server Components
      timestamp: doc.data().timestamp.toDate(),
    };
  });
}

// Set up a live restaurant snapshot listener.
export function getRestaurantsSnapshot(cb, filters = {}) {
  if (typeof cb !== "function") {
    console.log("Error: The callback parameter is not a function");
    return;
  }

  let q = query(collection(db, "restaurants"));
  q = applyQueryFilters(q, filters);

  return onSnapshot(q, (querySnapshot) => {
    const results = querySnapshot.docs.map((doc) => {
      return {
        id: doc.id,
        ...doc.data(),
        // Only plain objects can be passed to Client Components from Server Components
        timestamp: doc.data().timestamp.toDate(),
      };
    });

    cb(results);
  });
}

// Listen for updates to one restaurant.
export function getRestaurantSnapshotById(restaurantId, cb) {
  if (!restaurantId) {
    console.log("Error: Invalid ID received: ", restaurantId);
    return;
  }

  if (typeof cb !== "function") {
    console.log("Error: The callback parameter is not a function");
    return;
  }

  const docRef = doc(db, "restaurants", restaurantId);
  return onSnapshot(docRef, (docSnap) => {
    cb({
      ...docSnap.data(),
      timestamp: docSnap.data().timestamp.toDate(),
    });
  });
}

// Keep the older stub for compatibility.
// export function getRestaurantSnapshotById(restaurantId, cb) {
  // This stub is kept for compatibility.
 // return;
// }

// Fetch reviews for a restaurant.
export async function getReviewsByRestaurantId(db, restaurantId) {
  // Validate the restaurant ID.
  if (!restaurantId) {
    console.log("Error: Invalid restaurantId received: ", restaurantId);
    return;
  }

  // Create the reviews query.
  const q = query(
    collection(db, "restaurants", restaurantId, "ratings"),
    orderBy("timestamp", "desc")
  );

  // Fetch the review documents.
  const results = await getDocs(q);
  // Return plain objects for the client.
  return results.docs.map((doc) => {
    return {
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp.toDate(),
    };
  });
}

// Listen for live review updates.
export function getReviewsSnapshotByRestaurantId(restaurantId, cb) {
  // Validate the restaurant ID.
  if (!restaurantId) {
    console.log("Error: Invalid restaurantId received: ", restaurantId);
    return;
  }

  // Create the reviews query.
  const q = query(
    collection(db, "restaurants", restaurantId, "ratings"),
    orderBy("timestamp", "desc")
  );
  // Subscribe to review updates.
  return onSnapshot(q, (querySnapshot) => {
    // Map each snapshot item to plain objects.
    const results = querySnapshot.docs.map((doc) => {
      return {
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp.toDate(),
      };
    });
    // Pass the latest review list to the callback.
    cb(results);
  });
}

// Add fake restaurants and reviews.
export async function addFakeRestaurantsAndReviews() {
  // Generate the sample data.
  const data = await generateFakeRestaurantsAndReviews();
  // Loop through each restaurant entry.
  for (const { restaurantData, ratingsData } of data) {
    try {
      // Add the new restaurant document.
      const docRef = await addDoc(
        collection(db, "restaurants"),
        restaurantData
      );

      // Add each review under the restaurant.
      for (const ratingData of ratingsData) {
        await addDoc(
          collection(db, "restaurants", docRef.id, "ratings"),
          ratingData
        );
      }
    } catch (e) {
      // Log any insert errors.
      console.log("There was an error adding the document");
      console.error("Error adding document: ", e);
    }
  }
}
