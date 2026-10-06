import fetch from 'node-fetch';

// We'll hardcode some event data representing the different types we have to test them all
const testCases = [
  { id: 'panache', type: 'generic', min: 6 },
  { id: 'sync', type: 'generic', min: 8 },
  { id: 'band_jam', type: 'generic', min: 4 },
  { id: 'persona', type: 'generic', min: 1 },
  { id: 'echoes_of_noor', type: 'generic', min: 1 },
  { id: 'anime_quiz', type: 'generic', min: 2 },
  { id: 'bgmi', type: 'bgmi', min: 4 },
  { id: 'freefire', type: 'freefire', min: 4 },
  { id: 'valorant', type: 'valorant', min: 5 },
  { id: 'visitor', type: 'visitor', min: 1, isVisitor: true }
];

async function runTests() {
  console.log("Starting Registration API Tests...");
  
  for (const tc of testCases) {
    console.log(`\nTesting Event: ${tc.id} (Group: ${tc.type}, Min Members: ${tc.min})`);
    
    // Create base form data for the leader
    const baseData = {
      action: "CREATE_ORDER",
      name: "Demo Leader",
      email: `leader-${tc.id}@test.com`,
      mobile: "9999999999",
      phone: "9999999999",
      gender: "male",
      institutionName: "Demo University",
      address: "123 Demo Lane",
      registrationNumber: `REG_DEMO_${Date.now()}`,
      rollNumber: `REG_DEMO_${Date.now()}`,
      coupon: "",
      selectedEvents: [tc.id],
      amount: 100, // Dummy amount, the backend might recalculate or just accept it depending on logic
    };

    // Add group-specific leader data that the backend might validate
    if (tc.type === 'bgmi') {
      baseData[`bgmi_teamName`] = "Demo Team";
      baseData[`bgmi_leaderIgn`] = "DemoIGN";
      baseData[`bgmi_leaderUid`] = "12345678";
    } else if (tc.type === 'valorant') {
      baseData[`valorant_teamName`] = "Demo Val Team";
      baseData[`valorant_leaderRiotId`] = "Demo#1234";
    } else if (tc.type === 'freefire') {
      baseData[`freefire_teamName`] = "Demo FF Team";
      baseData[`freefire_leaderUid`] = "87654321";
    } else if (tc.type === 'generic' && tc.min > 1) {
      baseData[`generic_teamName`] = "Demo Generic Team";
    }

    // Generate Team Members
    const teamMembers = {};
    if (tc.isVisitor) {
      baseData.visitorConfig = { count: 1, days: ["day1"] };
    } else {
      const extraMembersCount = tc.min - 1;
      if (extraMembersCount > 0) {
        teamMembers[tc.type] = Array.from({ length: extraMembersCount }).map((_, i) => ({
          id: `m_${i}`,
          name: `Member ${i+1}`,
          email: `member${i+1}@test.com`,
          mobileNumber: "8888888888",
          gender: "female",
          age: "20",
          institutionName: "Demo University",
          address: "123 Demo Lane",
        }));
      }
    }
    
    baseData.teamMembers = teamMembers;

    try {
      const res = await fetch("http://localhost:3000/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(baseData)
      });
      
      const data = await res.json();
      
      if (res.ok) {
        console.log(`✅ Success for ${tc.id}: Order ID: ${data.order_id || 'Mock/No Order'} | Payment Session: ${data.payment_session_id ? 'Generated' : 'None'}`);
      } else {
        console.error(`❌ Failed for ${tc.id}: ${data.error || JSON.stringify(data)}`);
      }
    } catch (err) {
      console.error(`❌ Network error for ${tc.id}: ${err.message}`);
    }
    
    // Wait a bit to not overwhelm the dev server / rate limits
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

runTests();
