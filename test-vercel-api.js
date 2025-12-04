const axios = require('axios');

const VERCEL_API_TOKEN = 'lkAcW7Zhn4hvbkZjkykR1Thd';

async function getTeamInfo() {
    try {
        console.log('🔍 Fetching teams...\n');
        const response = await axios.get('https://api.vercel.com/v2/teams', {
            headers: { Authorization: `Bearer ${VERCEL_API_TOKEN}` }
        });

        console.log('✅ Teams found:');
        console.log(JSON.stringify(response.data, null, 2));

        if (response.data.teams && response.data.teams.length > 0) {
            console.log('\n📋 Your Team IDs:');
            response.data.teams.forEach(team => {
                console.log(`   - ${team.name}: ${team.id}`);
            });
        }
    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
    }
}

getTeamInfo();
