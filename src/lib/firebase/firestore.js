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
  // Filter by category when provided.
  if (category) {
    q = query(q, where("category", "==", category));
  }
  // Filter by city when provided.
  if (city) {
    q = query(q, where("city", "==", city));
  }
  // Filter by price when provided.
  if (price) {
    q = query(q, where("price", "==", price.length));
  }
  // Sort by rating by default.
  if (sort === "Rating" || !sort) {
    q = query(q, orderBy("avgRating", "desc"));
  } else if (sort === "Review") {
    // Sort by review count when selected.
    q = query(q, orderBy("numRatings", "desc"));
  }
  // Return the filtered query.
  return q;
}

// Fetch all matching restaurants.
export async function getRestaurants(db = db, filters = {}) {
  // Start with the restaurants collection query.
  let q = query(collection(db, "restaurants"));

  // Apply the current filters.
  q = applyQueryFilters(q, filters);
  // Get the matching restaurant documents.
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

// Set up a live restaurant snapshot listener.
export function getRestaurantsSnapshot(cb, filters = {}) {
  // Validate the callback first.
  if (typeof cb !== "function") {
    console.log("Error: The callback parameter is not a function");
    return;
  }

  // Create the filtered restaurant query.
  let q = query(collection(db, "restaurants"));
  // Apply the current filters.
  q = applyQueryFilters(q, filters);

  // Listen for Firestore changes.
  return onSnapshot(q, (querySnapshot) => {
    // Map each snapshot item to plain objects.
    const results = querySnapshot.docs.map((doc) => {
      return {
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp.toDate(),
      };
    });

    // Pass the latest list to the callback.
    cb(results);
  });
}

// Listen for updates to one restaurant.
export function getRestaurantSnapshotById(restaurantId, cb) {
  // Validate the restaurant ID.
  if (!restaurantId) {
    console.log("Error: Invalid ID received: ", restaurantId);
    return;
  }

  // Validate the callback.
  if (typeof cb !== "function") {
    console.log("Error: The callback parameter is not a function");
    return;
  }

  // Create the document reference.
  const docRef = doc(db, "restaurants", restaurantId);
  // Subscribe to document updates.
  return onSnapshot(docRef, (docSnap) => {
    // Send the restaurant object to the callback.
    cb({
      ...docSnap.data(),
      timestamp: docSnap.data().timestamp.toDate(),
    });
  });
}

// Keep the older stub for compatibility.
export function getRestaurantSnapshotById(restaurantId, cb) {
  // This stub is kept for compatibility.
  return;
}

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
