const SECRET_KEY = 'sk_test_Z1sBpXYmNah7lmnRH0tx3Qdmkaiusp9SPRys5pfft6';
const API_URL = 'https://api.clerk.com/v1/instance';

async function fixClerk() {
  try {
    const res = await fetch(API_URL, {
      method: "GET",
      headers: {
        'Authorization': `Bearer ${SECRET_KEY}`
      }
    });

    if (!res.ok) {
        throw new Error(await res.text());
    }
    
    const data = await res.json();
    console.log("Environment ID:", data.environment?.id);
    
    // Instead of parsing entire instance, in Clerk Backend API v1, 
    // You cannot change "required" user attributes via instance update programmatically as easily if it's not documented.
    // However, we can patch `user_settings` if we know what to send. 
    // Let's just output `data` into a file or log part of it
    
    // Let's check user settings
    console.log("Current Attributes:", JSON.stringify(data.user_settings?.attributes || {}, null, 2));

  } catch (err) {
    console.error(err);
  }
}

fixClerk();
