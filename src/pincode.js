// async function fetchPincodes() {
//     try {
//         const response = await fetch("https://67c6ecf8c19eb8753e77efdc.mockapi.io/api/v1/pincode");
//         if (!response.ok) {
//             throw new Error(`HTTP error! Status: ${response.status}`);
//         }

//         const data = await response.json();
//         console.log("Raw Pincode Data:", data);

//         // Transform data to required format
//         const formattedData = {
//             screen: "PINCODE_SELECTION_SCREEN",
//             data: {
//                 department: data.map(item => ({
//                     id: item.id,          // Keeping ID as it is
//                     title: item.pincode   // Renaming 'pincode' as 'title'
//                 }))
//             }
//         };

//         console.log("Formatted Pincode Data:", formattedData);
//         return formattedData;
//     } catch (error) {
//         console.error("Error fetching pincodes:", error);
//         return {
//             screen: "APPOINTMENT",
//             data: { department: [] } // Return empty structure on error
//         };
//     }
// }

// console.log("Script is running...");

// fetchPincodes();

import fetch from "node-fetch";

const PINCODE_API_URL = "https://67c6ecf8c19eb8753e77efdc.mockapi.io/api/v1/pincode";

// Function to fetch pincode data
export async function fetchPincodes() {
    try {
        const response = await fetch(PINCODE_API_URL);
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
        
        // Transforming the response to the required format
        const formattedData = data.map(item => ({
            id: item.id,
            title: item.pincode
        }));

        console.log("Formatted Pincode Data:", formattedData);
        return formattedData;
    } catch (error) {
        console.error("Error fetching pincodes:", error);
        return [];
    }
}


// Function to handle pincode-related actions
export const getPincodeScreen = async (decryptedBody) => {
    const { action, screen, data } = decryptedBody;

    if (action === "ping") {
        return { data: { status: "active" } };
    }

    if (action === "INIT") {
        try {
            const all_pincodes = await fetchPincodes();
            return {
                screen: "PINCODE_SELECTION_SCREEN",
                data: {
                    all_pincodes,
                    is_pincode_enabled: true
                }
            };
        } catch (error) {
            console.error("Error fetching pincodes:", error);
            return {
                screen: "ERROR",
                data: { message: "Failed to fetch pincodes." }
            };
        }
    }

    if (action === "data_exchange" && screen === "PINCODE_SELECTION_SCREEN") {
        const all_pincodes = await fetchPincodes(); // Fetch all pincodes
    
        // Find the matching pincode object by ID
        const selectedPincode = all_pincodes.find(pincode => pincode.id === data.selected_pincode);
    
        return {
            screen: "PINCODE_SELECTION_SCREEN", // Stay on the same screen
            data: {
                selected_pincode: selectedPincode ? selectedPincode.title : null, // Return the pincode title
                is_pincode_enabled: true
            }
        };
    }
    
    
    

    console.error("Unhandled pincode request:", decryptedBody);
    throw new Error("Unhandled pincode request.");
};


