const { getDb } = require('./_db.js');

// Core journeys visible to everyone (not user-specific)
const CORE_JOURNEYS = [
  {
    key: 'mindfulness-starter',
    title: 'Mindfulness Starter (7 days)',
    description: 'Simple daily breathing and awareness practices',
    steps: 7,
    points: 140,
    category: 'mindfulness',
    activities: [
      'Take 5 deep breaths mindfully',
      'Notice 3 things you can see around you',
      'Do a 3-minute body scan',
      'Practice grateful breathing for 5 minutes',
      'Listen mindfully to sounds for 5 minutes',
      'Take a mindful walk for 10 minutes',
      'Reflect on the week with 5 minutes of quiet'
    ],
    isCore: true
  },
  {
    key: 'stress-relief',
    title: 'Stress Relief (10 days)',
    description: 'Quick techniques to manage daily stress',
    steps: 10,
    points: 200,
    category: 'stress',
    activities: [
      'Try the 4-7-8 breathing technique',
      'Write down your top 3 concerns',
      'Take a 10-minute walk outside',
      'Do 5 minutes of gentle stretching',
      'Listen to calming music for 15 minutes',
      'Practice progressive muscle relaxation',
      'Call or text a friend for support',
      'Organize one small area of your space',
      'Practice saying positive affirmations',
      'Celebrate one small win from today'
    ],
    isCore: true
  },
  {
    key: 'sleep-better',
    title: 'Better Sleep (14 days)',
    description: 'Build healthy sleep habits gradually',
    steps: 14,
    points: 280,
    category: 'sleep',
    activities: [
      'Set a consistent bedtime',
      'Avoid screens 1 hour before bed',
      'Create a wind-down routine',
      'Keep your room cool and dark',
      'Avoid caffeine after 2 PM',
      'Do light stretching before bed',
      'Read for 15 minutes instead of scrolling',
      'Practice gratitude before sleep',
      'Take a warm shower or bath',
      'Try relaxation breathing in bed',
      'Write tomorrow\'s to-do list',
      'Reflect on your sleep quality',
      'Adjust your routine based on what works',
      'Plan to continue good sleep habits'
    ],
    isCore: true
  },
  {
    key: 'confidence-boost',
    title: 'Confidence Building (7 days)',
    description: 'Small daily actions to build self-confidence',
    steps: 7,
    points: 140,
    category: 'confidence',
    activities: [
      'Write down 3 things you like about yourself',
      'Practice good posture throughout the day',
      'Give someone a genuine compliment',
      'Share your opinion in a conversation',
      'Learn something new for 20 minutes',
      'Do something slightly outside your comfort zone',
      'Reflect on your growth this week'
    ],
    isCore: true
  }
];

module.exports = async function handler(req, res){
  try{
    const db = await getDb();
    const userJourneys = db.collection('user_journeys');
    const userProgress = db.collection('user_progress');
    const hiddenJourneys = db.collection('hidden_journeys'); // Track hidden core journeys per user
    
    if(req.method === 'GET'){
      const url = new URL(req.url, 'http://localhost');
      const userId = url.searchParams.get('userId') || url.searchParams.get('sessionId') || '';
      
      let journeys = [...CORE_JOURNEYS]; // Start with all core journeys
      let progress = {};
      
      // Add custom journeys and filter hidden core journeys if user is logged in
      if(userId && userId.trim() !== '' && userId !== 'undefined' && userId !== 'null') {
        try {
          // Get user's custom journeys
          const customJourneys = await userJourneys.find({ userId }).toArray();
          journeys = [...journeys, ...customJourneys];
          
          // Get user's hidden core journeys
          const hiddenCoreJourneys = await hiddenJourneys.find({ userId }).toArray();
          const hiddenKeys = hiddenCoreJourneys.map(h => h.journeyKey);
          
          // Filter out hidden core journeys
          journeys = journeys.filter(j => !hiddenKeys.includes(j.key));
          
          // Get user's progress on all journeys
          const progressData = await userProgress.find({ userId }).toArray();
          progress = progressData.reduce((acc, p) => {
            acc[p.journeyKey] = p.currentStep || 0;
            return acc;
          }, {});
        } catch (error) {
          console.error('Error fetching user journeys:', error);
        }
      }
      
      return res.status(200).json({ 
        ok: true, 
        journeys, 
        progress 
      });
    }
    
    if(req.method === 'POST'){
      const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
      const { userId, journeyKey, action } = body;
      
      if(!userId) {
        return res.status(400).json({ ok: false, error: 'User session required' });
      }
      
      // Handle progress update
      if(action === 'progress' && journeyKey) {
        await userProgress.updateOne(
          { userId, journeyKey },
          { 
            $inc: { currentStep: 1 },
            $set: { 
              userId, 
              journeyKey, 
              lastUpdated: new Date().toISOString() 
            }
          },
          { upsert: true }
        );
        return res.status(200).json({ ok: true });
      }
      
      // Handle custom journey creation
      if(action === 'create') {
        const { title, description, activities, category = 'custom' } = body;
        
        if(!title || !activities || !Array.isArray(activities)) {
          return res.status(400).json({ ok: false, error: 'Title and activities required' });
        }
        
        const journey = {
          key: `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          title: title.trim(),
          description: description?.trim() || '',
          steps: activities.length,
          points: activities.length * 20,
          category,
          activities,
          userId,
          isCustom: true,
          createdAt: new Date().toISOString()
        };
        
        await userJourneys.insertOne(journey);
        return res.status(200).json({ ok: true, journey });
      }
      
      // Handle journey deletion
      if(action === 'delete' && journeyKey) {
        // For custom journeys: delete from database
        await userJourneys.deleteOne({ key: journeyKey, userId });
        
        // For core journeys: add to hidden list instead of deleting
        const isCore = CORE_JOURNEYS.some(j => j.key === journeyKey);
        
        if (isCore) {
          await hiddenJourneys.updateOne(
            { userId, journeyKey },
            { 
              $set: { 
                userId, 
                journeyKey, 
                hiddenAt: new Date().toISOString() 
              }
            },
            { upsert: true }
          );
        }
        
        // Remove progress for all journeys (core and custom)
        await userProgress.deleteMany({ userId, journeyKey });
        
        return res.status(200).json({ ok: true, isCore });
      }
      
      return res.status(400).json({ ok: false, error: 'Invalid action' });
    }
    
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }catch(e){ 
    console.error('Journeys API error:', e);
    res.status(500).json({ ok: false, error: e.message }); 
  }
}
