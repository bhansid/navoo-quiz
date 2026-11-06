/*
 * Navoo quiz engine (shared by the browser and the report function).
 *
 * 7 questions -> a behavioural profile -> personalised report content.
 * No AI: every sentence comes from reviewed templates, chosen by scoring.
 *
 * Framework used:
 *  - COM-B (Capability, Opportunity, Motivation -> Behaviour) to find the blockers
 *  - Habit loops (cue -> routine -> reward) for "your current pattern"
 *  - Evidence-based techniques for the "brain cheat codes": friction/choice architecture,
 *    implementation intentions (if/then plans), habit stacking, tiny habits, self-compassion
 *    after lapses ("never miss twice"), urge surfing, social support, self-monitoring,
 *    temptation bundling.
 * Content is general wellbeing guidance, never calorie/weight targets.
 */

/* ------------------------------------------------------------------ */
/* Questions                                                           */
/* ------------------------------------------------------------------ */
export const QUESTIONS = [
  { id: 'goal', text: 'What are you most hoping to change right now?', options: [
    { id: 'lose', text: 'Lose weight' },
    { id: 'eat', text: 'Eat healthier / improve my eating habits' },
    { id: 'move', text: 'Move more / get fitter' },
    { id: 'energy', text: 'Feel healthier and have more energy' },
    { id: 'other', text: 'Something else' },
  ] },
  { id: 'domain', text: 'Which one change would make the biggest difference for you?', options: [
    { id: 'dinners', text: 'Healthier evening meals' },
    { id: 'snacking', text: 'Less snacking or grazing' },
    { id: 'portions', text: 'More comfortable portion sizes' },
    { id: 'movement', text: 'A regular movement or exercise routine' },
    { id: 'drinks', text: 'Fewer sugary drinks or less alcohol' },
    { id: 'sleep', text: 'Better sleep and steadier energy' },
  ] },
  { id: 'moment', text: 'When is it hardest to stick to your plan?', options: [
    { id: 'evenings', text: 'Evenings, after a long day' },
    { id: 'weekends', text: 'Weekends and social plans' },
    { id: 'busy', text: 'Busy or unpredictable days' },
    { id: 'emotional', text: 'When I’m stressed, bored or feeling low' },
    { id: 'mornings', text: 'Mornings, when the day is getting started' },
  ] },
  { id: 'barrier', text: 'In that moment, what usually gets in the way?', options: [
    { id: 'tired', text: 'I’m too tired or low on energy' },
    { id: 'convenience', text: 'The easy option is right there' },
    { id: 'time', text: 'I don’t have enough time' },
    { id: 'emotion', text: 'Stress or emotions take over' },
    { id: 'motivation', text: 'My motivation fades after a few days' },
    { id: 'clarity', text: 'I’m not sure what the right choice is' },
  ] },
  { id: 'pattern', text: 'Think about past attempts. What usually happens?', options: [
    { id: 'fade', text: 'I start strong, then life gets busy and it fades' },
    { id: 'allornothing', text: 'One slip-up and I feel like I’ve blown it' },
    { id: 'weekend', text: 'I do well in the week, then weekends undo it' },
    { id: 'neverstart', text: 'I keep planning to start, but never quite do' },
    { id: 'slow', text: 'I make progress, but it feels slow and I lose heart' },
  ] },
  { id: 'helper', text: 'What helps you follow through?', options: [
    { id: 'plan', text: 'Having a simple plan and knowing what to do in advance' },
    { id: 'social', text: 'Having someone alongside me' },
    { id: 'progress', text: 'Seeing my progress' },
    { id: 'flex', text: 'Flexibility to choose what works on the day' },
    { id: 'enjoy', text: 'Making it enjoyable or rewarding' },
  ] },
  { id: 'recovery', text: 'When things don’t go to plan, what would help most?', options: [
    { id: 'planb', text: 'A realistic alternative I can switch to' },
    { id: 'reminder', text: 'A gentle reminder of why it matters to me' },
    { id: 'checkin', text: 'A quick check-in to reset and move on' },
    { id: 'push', text: 'A firm nudge to stick to the original plan' },
    { id: 'space', text: 'Space to reset in my own time' },
  ] },
];

/* ------------------------------------------------------------------ */
/* Building blocks                                                     */
/* ------------------------------------------------------------------ */
const GOAL = {
  lose: { want: 'You want to lose weight and feel more confident in your body' },
  eat: { want: 'You want to eat healthier and build better eating habits' },
  move: { want: 'You want to move more and feel fitter' },
  energy: { want: 'You want to feel healthier and have more energy' },
  other: { want: 'You want to make a healthy change that actually lasts' },
};

const MOMENT = {
  evenings: { when: 'after work', short: 'after work', vulnerable: 'After a tiring workday, especially in the evenings.',
    feel: 'By then, you’re tired.', trigger: 'Work gets busy.', self: 'exhausted-at-7-PM', week: 'workweek', weekLabel: 'weekday' },
  weekends: { when: 'at weekends', short: 'at the weekend', vulnerable: 'At weekends, when routines loosen and plans change.',
    feel: 'Your routine loosens and plans change.', trigger: 'The weekend arrives and plans change.', self: 'Saturday-night', week: 'weekend', weekLabel: 'weekend' },
  busy: { when: 'on busy days', short: 'on busy, unpredictable days', vulnerable: 'On busy or unpredictable days, when your routine gets disrupted.',
    feel: 'Your routine gets squeezed.', trigger: 'Your day gets busy or unpredictable.', self: 'busiest-day', week: 'week', weekLabel: 'busy-day' },
  emotional: { when: 'when you’re stressed or low', short: 'when stress or a low mood hits', vulnerable: 'When you’re stressed, bored or feeling low.',
    feel: 'Your mind is looking for quick relief.', trigger: 'Stress or a low mood builds up.', self: 'stressed-out', week: 'week', weekLabel: 'everyday' },
  mornings: { when: 'in the mornings', short: 'in the morning', vulnerable: 'In the mornings, when the day is getting started.',
    feel: 'Time is short and the day is already pulling at you.', trigger: 'The morning rush takes over.', self: 'rushing-out-the-door', week: 'week', weekLabel: 'everyday' },
};

const BARRIER = {
  tired: { step: 'You get home exhausted.', stepAlt: 'Your energy runs low.', cond: 'too tired to', label: 'Low energy' },
  convenience: { step: 'The easy option is right there.', stepAlt: 'The easy option is right there.', cond: 'tempted by the easy option', label: 'Convenience' },
  time: { step: 'There’s no time left for your plan.', stepAlt: 'There’s no time left for your plan.', cond: 'short on time', label: 'Lack of time' },
  emotion: { step: 'You reach for comfort or relief.', stepAlt: 'You reach for comfort or relief.', cond: 'stressed or low', label: 'Stress and emotions' },
  motivation: { step: 'Your motivation has dipped.', stepAlt: 'Your motivation has dipped.', cond: 'not feeling motivated', label: 'Fading motivation' },
  clarity: { step: 'You’re not sure what the right choice is.', stepAlt: 'You’re not sure what the right choice is.', cond: 'unsure what to do', label: 'Uncertainty about what to do' },
};

const PATTERN = {
  fade: { start: 'You start with good intentions.', end: 'Things slowly fade and you feel off plan.' },
  allornothing: { start: 'You start with good intentions.', end: 'You feel like you’ve blown it for the day.' },
  weekend: { start: 'Your week starts well.', end: 'It feels like the week’s progress is undone.' },
  neverstart: { start: 'You plan to start soon.', end: 'Starting gets pushed back again.' },
  slow: { start: 'You start with good intentions.', end: 'Progress feels slow and you lose heart.' },
};

const HELPER = {
  plan: { helps: 'Having a simple plan and knowing what to do in advance.', said: 'knowing what to do in advance helps you follow through', add: ', planned ahead so you don’t have to decide in the moment' },
  social: { helps: 'Having someone alongside you.', said: 'having someone alongside you makes taking action more motivating', add: ', with a social element built in' },
  progress: { helps: 'Seeing your progress.', said: 'seeing your progress keeps you going', add: ', with an easy way to see your progress' },
  flex: { helps: 'Flexibility to choose what works on the day.', said: 'you do best when you have flexibility and choice', add: ', with a few options to choose from on the day' },
  enjoy: { helps: 'Making it enjoyable or rewarding.', said: 'you’re more likely to stick with things you enjoy', add: ', paired with things you genuinely enjoy' },
};

const RECOVERY = {
  planb: 'A realistic alternative, rather than being pushed to follow the original plan.',
  reminder: 'A gentle reminder of why it matters to you.',
  checkin: 'A quick check-in to reset and move on.',
  push: 'A firm nudge to get back to the original plan.',
  space: 'Space to reset in your own time, without pressure.',
};

/* Domain vocabulary: what the focus area is, its easy option, and practical ideas. */
const DOMAIN = {
  dinners: {
    title: m => ({ evenings: 'Healthier weekday dinners', weekends: 'Healthier weekend meals', busy: 'Healthier meals on busy days' }[m] || 'Healthier everyday dinners'),
    desc: m => m === 'evenings' ? 'Making healthier dinners easier to follow through on during your workweek.' : `Making healthier meals easier to follow through on ${MOMENT[m].when}.`,
    notProblem: 'knowing what a healthy dinner looks like',
    verb: 'cook', verbShort: 'cook', task: 'Cooking feels like another task.', effortStep: 'Cooking feels like too much effort.',
    easy: 'Takeaway', easyLower: 'takeaway', easyAvail: 'Takeaway is available immediately, so the easiest option often wins.',
    competing: 'Your healthier dinner is competing with something extremely convenient.',
    effortChain: 'plan, shop and cook',
    plural: 'healthier dinners', noun: 'healthier dinner',
    friction: ['Before the week starts, choose 3 easy dinners you’ll actually eat on busy days.', 'Keep the ingredients ready so you can start with minimal effort.', 'Have 1 emergency fallback meal that takes 5-10 minutes, or a pre-chosen healthier takeaway.'],
    fallback: 'have my fallback meal', fallbackIdeas: ['A 5-10 minute meal you enjoy', 'A pre-prepped meal in the fridge', 'A simple protein + veggies + carbs option', 'A healthier takeaway you already know and trust'],
    fallbackNote: 'This could be a simple meal you keep ready at home or a healthier takeaway option you’ve already chosen.',
    slip: 'a takeaway', smallChange: 'keep ingredients ready or choose a healthier option',
    anchor: 'get home and put my bag down', tiny: 'take out the ingredients for dinner',
    track: 'tick off each evening you have a planned dinner', enjoy: 'cook while listening to a favourite podcast or playlist',
    micro: { title: w => `Before your next ${w}, choose 3 healthier dinners.`, desc: 'Pick meals that you’d genuinely be happy to eat after a tiring day. Keep them simple and realistic. These are meals that {self} {name} would actually choose, not meals that require lots of planning or time in the kitchen.', list: 'Your 3 dinners:' },
    scenarios: [['Tired after work?', 'Use your fallback option.'], ['Got home late?', 'Choose the easier option.'], ['Unexpected plans?', 'Adjust your dinner instead of skipping it.'], ['Had a takeaway?', 'Learn what made it the easiest choice and continue the next day.']],
    weekend: ['Decide one weekend meal in advance, before Saturday arrives.', 'When eating out, glance at the menu ahead and pick something you’ll enjoy.', 'Enjoy social meals fully, then return to your normal routine at the next meal.'],
  },
  snacking: {
    title: m => ({ evenings: 'Smarter evening snacking', weekends: 'Calmer weekend snacking', emotional: 'Snacking that isn’t stress-driven' }[m] || 'Smarter everyday snacking'),
    desc: m => `Making it easier to snack with intention ${MOMENT[m].when}, instead of on autopilot.`,
    notProblem: 'knowing which snacks are healthier',
    verb: 'pause and choose', verbShort: 'choose', task: 'Pausing to choose takes effort you don’t have.', effortStep: 'Stopping to choose feels like too much effort.',
    easy: 'Grabbing whatever is nearby', easyLower: 'grabbing whatever snack is nearby', easyAvail: 'Snacks are within easy reach, so grabbing one often wins.',
    competing: 'Your healthier snack is competing with whatever is easiest to reach.',
    effortChain: 'stop, think and choose',
    plural: 'healthier snacks', noun: 'healthier snack',
    friction: ['Move the snacks you want less of out of sight, onto a high shelf or into a closed cupboard.', 'Put 2-3 snacks you feel good about at eye level and ready to eat.', 'Portion snacks into a bowl instead of eating straight from the packet.'],
    fallback: 'have one of my go-to snacks', fallbackIdeas: ['A piece of fruit with a few nuts', 'Yoghurt or a protein snack you like', 'A hot drink to pause and reset', 'A pre-portioned treat, enjoyed sitting down'],
    fallbackNote: 'Choose snacks you actually enjoy, ready to grab when the urge hits.',
    slip: 'an unplanned snack', smallChange: 'move the snack out of sight or portion it into a bowl',
    anchor: 'make my afternoon tea or coffee', tiny: 'put my go-to snack out where I can see it',
    track: 'tick off each day your snacks were planned rather than grabbed', enjoy: 'have your planned snack sitting down, without screens, and really enjoy it',
    micro: { title: () => 'This week, choose 3 go-to snacks you feel good about.', desc: 'Pick snacks you genuinely enjoy and that are easy to grab. Keep them visible and ready, so the planned option is the easiest option when hunger or habit kicks in, even for busy, tired {name}.', list: 'Your 3 go-to snacks:' },
    scenarios: [['Craving hits?', 'Pause for 10 minutes, then decide.'], ['Bored or restless?', 'Change rooms or do a quick task first.'], ['Snacks in sight?', 'Move them out of view.'], ['Ate more than planned?', 'Notice what triggered it and carry on.']],
    weekend: ['Decide your weekend treats in advance and enjoy them guilt-free.', 'Keep your go-to snacks stocked before the weekend starts.', 'At social events, choose one treat you’ll really enjoy rather than grazing.'],
  },
  portions: {
    title: m => m === 'evenings' ? 'Comfortable evening portions' : 'More comfortable portion sizes',
    desc: m => `Making it easier to eat until comfortably satisfied ${MOMENT[m].when}, without feeling restricted.`,
    notProblem: 'knowing what a sensible portion looks like',
    verb: 'slow down and notice fullness', verbShort: 'think about it', task: 'Eating on autopilot makes portions creep up.', effortStep: 'Slowing down feels like extra effort.',
    easy: 'Eating on autopilot', easyLower: 'eating on autopilot', easyAvail: 'Big plates and eating on the go make bigger portions the default.',
    competing: 'Your portion goal is competing with habits that run on autopilot.',
    effortChain: 'slow down and check in with your hunger',
    plural: 'more comfortable portions', noun: 'comfortable portion',
    friction: ['Serve meals on a slightly smaller plate and leave serving dishes in the kitchen.', 'Fill half your plate with vegetables or salad first.', 'Pause halfway through your meal for 1 minute and check how full you feel.'],
    fallback: 'serve a smaller first portion and wait before seconds', fallbackIdeas: ['A smaller plate, with seconds only after a pause', 'Half the plate vegetables or salad', 'Eat sitting down, without screens', 'A glass of water before the meal'],
    fallbackNote: 'Keep it simple: one easy rule that works even when you’re busy or tired.',
    slip: 'a bigger meal than planned', smallChange: 'use a smaller plate or pause halfway',
    anchor: 'sit down to eat', tiny: 'put my fork down between bites',
    track: 'tick off each meal you paused halfway to check in', enjoy: 'make meals a moment: sit down, slow down and really taste your food',
    micro: { title: () => 'At your next 3 main meals, try one portion strategy.', desc: 'Pick one simple strategy, like a smaller plate or pausing halfway. Keep it easy enough that {name} can do it on a busy, tired day, not just on a calm one.', list: 'Your 3 portion strategies:' },
    scenarios: [['Eating out?', 'Pause halfway and check in.'], ['Eating in a rush?', 'Sit down for just 5 minutes.'], ['Still hungry?', 'Wait 10 minutes, then decide.'], ['Overate?', 'No guilt. Just carry on at the next meal.']],
    weekend: ['Plan one relaxed meal and enjoy it without rules.', 'At buffets or sharing meals, take one plate and sit down to eat.', 'Get back to your usual plate and pace at the next meal.'],
  },
  movement: {
    title: m => ({ evenings: 'An after-work movement routine', mornings: 'A morning movement routine', weekends: 'Active, enjoyable weekends' }[m] || 'A movement routine that sticks'),
    desc: m => `Making regular movement easier to fit in ${MOMENT[m].when}, even when life is busy.`,
    notProblem: 'knowing which exercise to do',
    verb: 'work out', verbShort: 'work out', task: 'Exercise feels like one more thing to fit in.', effortStep: 'A full workout feels like too much.',
    easy: 'The sofa', easyLower: 'skipping it', easyAvail: 'Skipping is always available, so it often wins.',
    competing: 'Your workout is competing with the easiest option of all: not starting.',
    effortChain: 'get changed, get going and fit in a full session',
    plural: 'regular movement', noun: 'workout',
    friction: ['Lay out your workout clothes and shoes the night before.', 'Choose 3 short workouts you can do at home in 10-20 minutes.', 'Put a time in your calendar for movement, like any other appointment.'],
    fallback: 'do a 5-minute version', fallbackIdeas: ['A 5-minute walk around the block', 'A 5-minute stretch or mobility routine', '10 squats and a short bodyweight circuit', 'A walk during a phone call'],
    fallbackNote: 'A short version still counts. It keeps the habit alive on difficult days.',
    slip: 'a missed workout', smallChange: 'lay out your kit or do a shorter session',
    anchor: 'finish my morning coffee', tiny: 'put on my trainers and move for 2 minutes',
    track: 'tick off every day you move, even for 5 minutes', enjoy: 'save a favourite podcast or playlist for workouts only',
    micro: { title: w => `Before your next ${w}, schedule 3 short movement sessions.`, desc: 'Choose sessions you’d genuinely be happy to do on a tiring day. Keep them short and realistic. These are sessions that busy {name} would actually do, not ones that need lots of time or motivation.', list: 'Your 3 sessions (day + time):' },
    scenarios: [['Too tired?', 'Do the 5-minute version.'], ['Short on time?', 'Walk while you take a call.'], ['Plans changed?', 'Move your session, don’t delete it.'], ['Missed a day?', 'Never miss twice. Move tomorrow.']],
    weekend: ['Plan one active thing you enjoy, like a walk with a friend.', 'Do your movement early, before plans take over.', 'Make it social: invite someone along.'],
  },
  drinks: {
    title: m => m === 'weekends' ? 'Mindful weekend drinking' : 'Fewer sugary drinks and less alcohol',
    desc: m => `Making better drink choices easier ${MOMENT[m].when}, without feeling like you’re missing out.`,
    notProblem: 'knowing which drinks are healthier',
    verb: 'choose a lighter drink', verbShort: 'think about it', task: 'Your usual drink is the default.', effortStep: 'Choosing something different feels like effort.',
    easy: 'Your usual drink', easyLower: 'your usual drink', easyAvail: 'Your usual drink is always there, so habit usually wins.',
    competing: 'Your lighter drink is competing with a well-worn habit.',
    effortChain: 'stop and choose something different',
    plural: 'better drink choices', noun: 'lighter drink',
    friction: ['Keep 2-3 drinks you enjoy (sparkling water, herbal tea, low/no options) ready in the fridge.', 'Don’t keep your usual drink in easy reach at home.', 'Decide your drink limit before you go out, not when you’re there.'],
    fallback: 'have my swap drink first', fallbackIdeas: ['Sparkling water with fruit', 'A low or no alcohol option', 'Herbal tea or a hot drink', 'Alternate every drink with water'],
    fallbackNote: 'Pick swaps you genuinely like, so it doesn’t feel like a sacrifice.',
    slip: 'a few more drinks than planned', smallChange: 'start with your swap drink or alternate with water',
    anchor: 'get home and open the fridge', tiny: 'pour my swap drink first',
    track: 'tick off each day you stuck to your drinks plan', enjoy: 'make your swap drink feel special: a nice glass, ice and fruit',
    micro: { title: () => 'This week, choose 3 swap drinks you actually enjoy.', desc: 'Pick drinks that feel like a treat, not a punishment. Keep them stocked and ready, so the better choice is the easiest one for {name} when habit kicks in.', list: 'Your 3 swap drinks:' },
    scenarios: [['Social event?', 'Decide your limit before you go.'], ['Stressful day?', 'Have your swap drink first.'], ['Habit kicks in?', 'Pause, then choose on purpose.'], ['Had more than planned?', 'Notice why and reset tomorrow.']],
    weekend: ['Decide your drinks plan before the weekend starts.', 'Alternate each drink with water when you’re out.', 'Have one or two alcohol-free days you look forward to.'],
  },
  sleep: {
    title: () => 'Better sleep and steadier energy',
    desc: m => `Building a wind-down routine that makes rest easier, especially ${MOMENT[m].when}.`,
    notProblem: 'knowing that sleep matters',
    verb: 'wind down', verbShort: 'wind down properly', task: 'Winding down feels harder than one more scroll.', effortStep: 'Switching off feels like effort.',
    easy: 'Scrolling late', easyLower: 'staying up scrolling', easyAvail: 'Your phone is always within reach, so scrolling often wins.',
    competing: 'Your bedtime is competing with something endlessly entertaining.',
    effortChain: 'switch off, put the phone down and get to bed',
    plural: 'better sleep habits', noun: 'wind-down routine',
    friction: ['Charge your phone outside the bedroom, or across the room.', 'Set a wind-down alarm 30 minutes before bed.', 'Keep the same wake-up time, even at weekends.'],
    fallback: 'do a 10-minute wind-down', fallbackIdeas: ['Phone on charge outside the bedroom', 'A warm shower or a few pages of a book', 'Dim lights and slow breathing for 5 minutes', 'Write tomorrow’s to-do list to clear your head'],
    fallbackNote: 'A short wind-down still helps, even on busy nights.',
    slip: 'a late night', smallChange: 'charge your phone outside the bedroom or set a wind-down alarm',
    anchor: 'brush my teeth', tiny: 'put my phone on charge outside the bedroom',
    track: 'tick off each night you started winding down on time', enjoy: 'make your wind-down something you look forward to: a book, a bath or calming music',
    micro: { title: () => 'Tonight, set up your 3-step wind-down routine.', desc: 'Pick three simple steps you’d genuinely enjoy at the end of the day. Keep them short, so tired {name} can follow them without thinking.', list: 'Your 3 wind-down steps:' },
    scenarios: [['Late night?', 'Keep your usual wake-up time.'], ['Can’t switch off?', 'Write down what’s on your mind.'], ['Phone in hand?', 'Put it on charge, out of reach.'], ['Slept badly?', 'Get daylight early and carry on.']],
    weekend: ['Keep your wake-up time within an hour of weekdays.', 'Plan one relaxing evening without screens.', 'Get outside in daylight in the morning.'],
  },
};

/* ------------------------------------------------------------------ */
/* Scoring: answers -> factor scores (COM-B style)                     */
/* ------------------------------------------------------------------ */
const POINTS = {
  moment: { evenings: { ENERGY: 2, FRICTION: 1 }, weekends: { SOCIAL: 3, ALLORNOTHING: 1 }, busy: { TIME: 3, FRAGILE: 1 }, emotional: { EMOTION: 3 }, mornings: { TIME: 2, FRICTION: 1 } },
  barrier: { tired: { ENERGY: 3, FRICTION: 1 }, convenience: { FRICTION: 3 }, time: { TIME: 3 }, emotion: { EMOTION: 3 }, motivation: { MOTIVATION: 3 }, clarity: { CLARITY: 3 } },
  pattern: { fade: { FRAGILE: 3, MOTIVATION: 1 }, allornothing: { ALLORNOTHING: 3 }, weekend: { SOCIAL: 2, ALLORNOTHING: 1 }, neverstart: { START: 3, CLARITY: 1 }, slow: { MOTIVATION: 2, ALLORNOTHING: 1 } },
  domain: { dinners: { FRICTION: 1, ENERGY: 1 }, snacking: { FRICTION: 2, EMOTION: 1 }, portions: { FRICTION: 1 }, movement: { START: 1, TIME: 1 }, drinks: { SOCIAL: 1, FRICTION: 1 }, sleep: { ENERGY: 1, FRICTION: 1 } },
};
// Tie-break order (earlier = preferred when scores are equal)
const FACTOR_ORDER = ['FRICTION', 'ENERGY', 'FRAGILE', 'TIME', 'EMOTION', 'ALLORNOTHING', 'MOTIVATION', 'SOCIAL', 'START', 'CLARITY'];

/* Blocker cards (page 2) */
const BLOCKERS = {
  ENERGY: (c) => ({ title: 'Your difficult moment is predictable.', text: `You’re most likely to struggle ${c.m.when}, when your energy is low. This makes it harder to ${c.d.verb}, and you’re more likely to choose the easiest option.` }),
  FRICTION: (c) => ({ title: 'Convenience is beating intention.', text: `You do want ${c.d.plural}, but in the moment, ${c.d.easyLower} is quicker and easier. When the healthier choice takes more effort, convenience usually wins, so it’s hard to stick with your original plan.` }),
  FRAGILE: () => ({ title: 'Your plan needs to survive a busy day.', text: 'Your past attempts tend to work at the start, but when life gets busy, consistency becomes harder. You need a plan that works not just for your good days, but also for the days when you’re tired, stressed or short on time.' }),
  TIME: (c) => ({ title: 'Time is the bottleneck.', text: `On busy days, ${c.d.plural} are the first thing to get squeezed out. It’s not that you don’t care. Your plan simply needs to take less time and fewer decisions.` }),
  EMOTION: (c) => ({ title: 'Stress is steering the choice.', text: `When you’re stressed, bored or low, ${c.d.easyLower} becomes a quick way to feel better. That’s a normal brain shortcut, not a lack of willpower, but it means stressful moments need their own plan.` }),
  ALLORNOTHING: () => ({ title: 'One slip feels like starting over.', text: 'When things don’t go perfectly, it can feel like the whole plan is ruined. That all-or-nothing feeling turns one small slip into a lost day, or even a lost week.' }),
  MOTIVATION: () => ({ title: 'Motivation is doing the heavy lifting.', text: 'Your plan relies on feeling motivated, and motivation naturally rises and falls. When it dips after a few days, there’s nothing else holding the habit in place yet.' }),
  SOCIAL: () => ({ title: 'Weekends pull you off course.', text: 'Your weekday routine works better than your weekends. Social plans, eating out and a looser schedule make the healthier choice harder to stick to.' }),
  START: () => ({ title: 'Getting started is the hardest part.', text: 'Plans often get set for “Monday” or “next week”. Starting feels big, so it keeps getting pushed back. Your first step needs to be small enough to start today.' }),
  CLARITY: () => ({ title: 'Too much advice, not enough clarity.', text: 'With so much conflicting advice out there, it’s hard to know what to focus on. When the next step isn’t clear, it’s easy to put it off or fall back on old habits.' }),
};

const INSIGHT = {
  ENERGY: ['The problem isn’t that you don’t know what to do.', 'It’s making the healthier option easier at the moments when your energy is lowest.'],
  FRICTION: ['The problem isn’t that you don’t know what to do.', 'It’s making the healthier option easier than the convenient one.'],
  FRAGILE: ['The problem isn’t a lack of effort.', 'It’s having a plan that still works on your busiest, most tiring days.'],
  TIME: ['The problem isn’t a lack of effort.', 'It’s having a plan that takes less time and fewer decisions.'],
  EMOTION: ['The problem isn’t willpower.', 'It’s having another way to look after yourself when stress hits.'],
  ALLORNOTHING: ['The problem isn’t the slip-up.', 'It’s what happens next. Getting back on track quickly matters more than being perfect.'],
  MOTIVATION: ['The problem isn’t a lack of motivation.', 'It’s building habits that don’t depend on how motivated you feel.'],
  SOCIAL: ['The problem isn’t your weekdays.', 'It’s having a simple, flexible plan for weekends and social moments.'],
  START: ['The problem isn’t knowing you should start.', 'It’s making the first step so small that starting is easy.'],
  CLARITY: ['The problem isn’t effort.', 'It’s knowing the one or two changes that matter most for you.'],
};

const CALLOUT = {
  ENERGY: 'You don’t need more motivation. You need to make the healthier choice easier when your energy is lowest.',
  FRICTION: 'You don’t need more willpower. You need to make the healthier choice the easiest one.',
  FRAGILE: 'You don’t need to try harder. You need a plan that can bend without breaking.',
  TIME: 'You don’t need a perfect plan. You need one that fits your busiest days.',
  EMOTION: 'You don’t need more willpower. You need a kinder plan for stressful moments.',
  ALLORNOTHING: 'You don’t need to be perfect. You need to get back on track faster.',
  MOTIVATION: 'You don’t need to feel motivated. You need habits that run without it.',
  SOCIAL: 'You don’t need to skip social plans. You need a simple strategy for them.',
  START: 'You don’t need to wait for Monday. You need a first step small enough to take today.',
  CLARITY: 'You don’t need more information. You need one clear next step.',
};

const SNAPSHOT_IS = {
  ENERGY: 'keeping things going when your energy is low',
  FRICTION: 'the easy option winning in the moment',
  FRAGILE: 'keeping things going when your schedule gets busy',
  TIME: 'finding time when your days get busy',
  EMOTION: 'what happens when stress or a low mood hits',
  ALLORNOTHING: 'getting back on track after a slip-up',
  MOTIVATION: 'keeping going once the first burst of motivation fades',
  SOCIAL: 'staying on track at weekends and around social plans',
  START: 'taking the very first step',
  CLARITY: null, // handled separately
};

const BEST_START = {
  removeFriction: 'making the healthier option the easiest one',
  planB: 'smaller, more flexible actions that fit around your real life',
  keepGoing: 'a kinder, more flexible approach that lets you bounce back quickly',
  habitStack: 'tiny habits linked to things you already do every day',
  startTiny: 'a first step so small it feels almost too easy',
  stressSwap: 'a planned way to handle stressful moments',
  weekendPlan: 'a simple, flexible plan for weekends and social moments',
  oneThing: 'focusing on one clear change at a time',
  buddy: 'small, shared actions with someone in your corner',
  trackIt: 'small actions you can see adding up',
  enjoy: 'healthy habits that feel rewarding, not like a chore',
};

/* ------------------------------------------------------------------ */
/* Brain cheat codes (page 3)                                          */
/* ------------------------------------------------------------------ */
const CODES = {
  removeFriction: {
    w: { FRICTION: 3, ENERGY: 2, TIME: 1 },
    build: (c) => ({
      title: 'Remove friction',
      explain: `${c.d.competing} ${cap(c.m.when)}, ${c.d.easyLower} is easier than having to ${c.d.effortChain}.`,
      callout: `Make the decision earlier, so you don’t have to rely on ${c.m.self} ${c.name} to figure it out.`,
      tips: c.d.friction, icon: 'bulb',
    }),
  },
  planB: {
    w: { FRAGILE: 3, TIME: 2, ENERGY: 1 },
    build: (c) => ({
      title: 'Plan for the day that goes wrong',
      explain: c.a.pattern === 'fade'
        ? 'Your past attempts tend to work at the start, but when life gets busy, consistency becomes harder. You need a plan that survives your difficult days, not just your good days.'
        : 'Most plans are built for good days. Yours needs to work on the days when you’re tired, stressed or short on time too.',
      callout: 'Instead of one perfect plan, have a clear Plan B for when you’re tired, stressed or short on time.',
      tips: [`Create a fallback option for ${c.m.when === 'after work' ? 'evenings' : 'days'} when your main plan isn’t realistic.`,
        `Use an if/then plan: “If I’m ${cond(c)}, then I’ll ${c.d.fallback} instead.”`,
        'Keep your fallback just as valid as your main plan. Both keep you moving towards your goal.'],
      icon: 'calendar',
    }),
  },
  keepGoing: {
    w: { ALLORNOTHING: 3, FRAGILE: 1, MOTIVATION: 1, SOCIAL: 1 },
    build: (c) => ({
      title: 'Keep going after slip-ups',
      explain: `Your answers suggest that once life interrupts your plan, it can feel harder to get back on track. One ${c.d.slip.replace(/^an? /, '')} or a busy week doesn’t mean you’ve failed. It’s information.`,
      callout: 'Don’t restart. Adjust and continue.',
      tips: [`If you have ${c.d.slip}, ask yourself what made it the easiest option.`, `Look for one small change you can make (e.g. ${c.d.smallChange}).`, 'Focus on the next opportunity rather than starting again from the beginning.'],
      icon: 'refresh',
    }),
  },
  habitStack: {
    w: { MOTIVATION: 3, START: 2, CLARITY: 1 },
    build: (c) => ({
      title: 'Anchor it to something you already do',
      explain: 'Relying on motivation means the habit only happens on good days. Linking a new habit to something you already do every day makes it more automatic over time.',
      callout: `“After I ${c.d.anchor}, I will ${c.d.tiny}.”`,
      tips: ['Pick an anchor you do every single day, without thinking.', 'Make the new habit tiny at first, so it takes under 2 minutes.', 'Repeat it in the same place and order until it feels automatic.'],
      icon: 'link',
    }),
  },
  startTiny: {
    w: { START: 3, MOTIVATION: 2, TIME: 1 },
    build: (c) => ({
      title: 'Make it too small to skip',
      explain: 'Big plans need big motivation. Tiny actions don’t. Starting with a version so small you can’t say no builds the routine first, then you can grow it.',
      callout: 'Start so small it feels almost too easy. Consistency first, then build.',
      tips: [`Shrink your first step to 2 minutes, e.g. ${c.d.tiny}.`, 'Start today, not on Monday. There’s no perfect day to begin.', 'Only increase it once it feels automatic for a full week.'],
      icon: 'seed',
    }),
  },
  stressSwap: {
    w: { EMOTION: 4 },
    build: (c) => ({
      title: 'Give stress a different outlet',
      explain: `When stress builds, your brain looks for the fastest way to feel better, and ${c.d.easyLower} often feels like the quickest fix. Planning a different quick comfort gives that urge somewhere else to go.`,
      callout: 'Pause, name the feeling, then choose your planned comfort.',
      tips: ['Write down 3 quick comforts you enjoy, like a short walk, a shower or calling a friend.', 'When the urge hits, wait 10 minutes and try one of them first. Urges rise, peak and pass.', 'If you still choose the easy option, do it mindfully and without guilt, then move on.'],
      icon: 'heart',
    }),
  },
  weekendPlan: {
    w: { SOCIAL: 4 },
    build: (c) => ({
      title: 'Give weekends their own plan',
      explain: 'Weekday routines don’t automatically carry into weekends. A light, flexible weekend plan keeps your progress going without taking the fun out of it.',
      callout: 'Plan the weekend before it starts, then enjoy it.',
      tips: c.d.weekend, icon: 'sun',
    }),
  },
  oneThing: {
    w: { CLARITY: 4, START: 1 },
    build: (c) => ({
      title: 'Focus on one change at a time',
      explain: `Trying to change everything at once is overwhelming. Your best results come from one clear change, ${c.d.plural}, done consistently until it sticks.`,
      callout: 'One small, clear change beats ten good intentions.',
      tips: ['Ignore everything else for the next 30 days. This is your one focus.', 'Write your focus somewhere you’ll see it every day.', 'Only add a second change once the first feels easy.'],
      icon: 'target',
    }),
  },
  buddy: {
    w: { MOTIVATION: 1, SOCIAL: 1 }, helper: { social: 4 },
    build: (c) => ({
      title: 'Bring someone alongside you',
      explain: 'You told us having someone alongside you helps. Support and gentle accountability make it much easier to follow through, especially on harder days.',
      callout: 'Tell one person your plan and check in with them once a week.',
      tips: ['Choose a friend, partner or colleague and share your 30-day focus.', 'Agree a quick weekly check-in: a message is enough.', 'Do one healthy activity together, like a walk or a meal.'],
      icon: 'users',
    }),
  },
  trackIt: {
    w: { MOTIVATION: 1 }, helper: { progress: 4 }, pattern: { slow: 2 },
    build: (c) => ({
      title: 'Make progress visible',
      explain: 'Real progress is often invisible day to day, which makes it easy to lose heart. Seeing small wins add up keeps you going.',
      callout: 'What you can see, you’re more likely to repeat.',
      tips: [`Use a simple habit tracker and ${c.d.track}.`, 'Track the action, not the result. Actions are what you control.', 'Look back at your streak each week and notice what’s working.'],
      icon: 'chart',
    }),
  },
  enjoy: {
    w: { MOTIVATION: 1 }, helper: { enjoy: 4 },
    build: (c) => ({
      title: 'Pair it with something you enjoy',
      explain: 'Habits stick when they feel rewarding. Pairing your new habit with something you already look forward to makes it easier to repeat.',
      callout: 'If it feels good, you’ll want to do it again.',
      tips: [`${cap(c.d.enjoy)}.`, 'Give yourself a small, non-food reward after a week of consistency.', 'Notice how you feel afterwards. That feeling is part of the reward.'],
      icon: 'star',
    }),
  },
};

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */
function cond(c) { return c.a.barrier === 'tired' ? `too tired to ${c.d.verbShort}` : c.b.cond; }
function cap(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }
export function cleanName(n) {
  const s = String(n || '').replace(/[^\p{L}\p{M}' -]/gu, '').trim().replace(/\s+/g, ' ').slice(0, 30);
  return s ? s.split(' ')[0].replace(/^./, ch => ch.toUpperCase()) : '';
}

export function validateAnswers(a) {
  if (!a || typeof a !== 'object') return false;
  return QUESTIONS.every(q => q.options.some(o => o.id === a[q.id]));
}

export function scoreFactors(a) {
  const f = {};
  for (const key of ['moment', 'barrier', 'pattern', 'domain']) {
    const pts = POINTS[key][a[key]] || {};
    for (const [k, v] of Object.entries(pts)) f[k] = (f[k] || 0) + v;
  }
  return FACTOR_ORDER.map(k => [k, f[k] || 0]).sort((x, y) => y[1] - x[1] || FACTOR_ORDER.indexOf(x[0]) - FACTOR_ORDER.indexOf(y[0]));
}

function pickCodes(a, factors) {
  const fv = Object.fromEntries(factors);
  const scored = Object.entries(CODES).map(([id, code]) => {
    let s = 0;
    for (const [k, w] of Object.entries(code.w)) s += w * (fv[k] || 0);
    if (code.helper && code.helper[a.helper]) s += code.helper[a.helper] * 3;
    if (code.pattern && code.pattern[a.pattern]) s += code.pattern[a.pattern] * 3;
    if (id === 'planB' && (a.recovery === 'planb' || a.helper === 'flex')) s += 6;
    if (id === 'keepGoing' && (a.recovery === 'checkin' || a.recovery === 'space')) s += 4;
    if (id === 'removeFriction' && a.helper === 'plan') s += 4;
    return [id, s];
  }).sort((x, y) => y[1] - x[1]);
  return scored.slice(0, 3).map(x => x[0]);
}

/* ------------------------------------------------------------------ */
/* Public: profile, snapshot (on page), full report (PDF)              */
/* ------------------------------------------------------------------ */
export function buildProfile(a) {
  const factors = scoreFactors(a);
  const top = factors.filter(x => x[1] > 0).slice(0, 3).map(x => x[0]);
  while (top.length < 3) { const next = FACTOR_ORDER.find(k => !top.includes(k)); top.push(next); }
  const codes = pickCodes(a, factors);
  return { factors, top, codes, focus: DOMAIN[a.domain].title(a.moment) };
}

export function buildSnapshot(a) {
  const p = buildProfile(a);
  const g = GOAL[a.goal], h = HELPER[a.helper];
  const t = p.top[0];
  const p1 = t === 'CLARITY'
    ? `${g.want}. From your answers, it looks like your biggest challenge is knowing which changes will make the biggest difference for you, rather than a lack of effort.`
    : `${g.want}. From your answers, it looks like your biggest challenge isn’t knowing what you should do. It’s ${SNAPSHOT_IS[t]}.`;
  const p2 = `You also said that ${h.said}. That means your best starting point may be ${BEST_START[p.codes[0]]}${h.add}.`;
  return { paragraphs: [p1, p2], focus: p.focus, profile: p };
}

export function buildReport(a, rawName) {
  const name = cleanName(rawName) || 'Friend';
  const p = buildProfile(a);
  const d = DOMAIN[a.domain], m = MOMENT[a.moment], b = BARRIER[a.barrier];
  const ctx = { a, d, m, b, name };
  const t = p.top[0];
  const selfLabel = { evenings: 'tired-after-work', weekends: 'Saturday-night', busy: 'busiest-day', emotional: 'stressed-out', mornings: 'rushing-out-the-door' }[a.moment];
  const fill = s => s.replace(/\{self\} /g, selfLabel + ' ').replace(/\{name\}/g, name);

  const bigPicture = [
    `You want ${p.focus.charAt(0).toLowerCase() + p.focus.slice(1)}, but your answers suggest the problem isn’t ${t === 'CLARITY' ? 'a lack of effort' : d.notProblem}.`,
    `The difficult moment comes **${m.short}.** ${m.feel} ${d.task} ${d.easyAvail}`,
  ];

  const patternSteps = [
    PATTERN[a.pattern].start,
    m.trigger,
    a.moment === 'evenings' ? b.step : b.stepAlt,
    d.effortStep,
    `${d.easy} becomes the easiest option.`,
    PATTERN[a.pattern].end,
  ];
  // Avoid repeating "easy option" twice in a row
  if (a.barrier === 'convenience') patternSteps[2] = a.moment === 'evenings' ? 'You get home tired.' : 'Your energy and focus dip.';
  if (a.barrier === 'tired' && a.moment !== 'evenings') patternSteps[2] = 'Your energy runs low.';

  const blockers = p.top.map(k => BLOCKERS[k](ctx));
  const factorLabels = { ENERGY: 'Low energy', FRICTION: 'Convenience', FRAGILE: 'Busy days', TIME: 'Lack of time', EMOTION: 'Stress and emotions', ALLORNOTHING: 'All-or-nothing thinking', MOTIVATION: 'Fading motivation', SOCIAL: 'Weekends and social plans', START: 'Getting started', CLARITY: 'Unclear next steps' };
  const l1 = factorLabels[p.top[0]], l2 = factorLabels[p.top[1]].toLowerCase();
  const getsInWay = (l1.includes(' and ') || l2.includes(' and ')) ? `${l1}, plus ${l2}.` : `${l1} and ${l2}.`;

  const codes = p.codes.map(id => CODES[id].build(ctx));
  const week = m.week === 'weekend' ? 'weekend' : (m.week === 'workweek' ? 'workweek' : 'week');

  return {
    name,
    focus: { title: p.focus, desc: d.desc(a.moment) },
    bigPicture,
    callout: CALLOUT[t],
    closing: 'The opportunity isn’t to make you try harder. It’s to change what happens at the point where your plan usually breaks down.',
    pattern: patternSteps,
    blockers,
    insight: INSIGHT[t],
    table: {
      want: `${p.focus}.`,
      vulnerable: m.vulnerable,
      getsInWay,
      helps: HELPER[a.helper].helps,
      prefer: RECOVERY[a.recovery],
    },
    codesIntro: `Based on your answers, these three strategies are most likely to help you make progress with ${p.focus.charAt(0).toLowerCase() + p.focus.slice(1)}.`,
    codes,
    micro: {
      subtitle: `A small, realistic step to get you started with ${p.focus.charAt(0).toLowerCase() + p.focus.slice(1)}.`,
      title: d.micro.title(week),
      desc: fill(d.micro.desc),
      list: d.micro.list,
      fallbackLead: `If I’m ${cond(ctx)}, I’ll:`,
      fallbackNote: d.fallbackNote,
      fallbackIdeas: d.fallbackIdeas,
      scenarios: d.scenarios.map(([title, text]) => ({ title, text })),
      closing: ['You don’t need another Day One.', 'You need a plan that can bend without breaking.'],
    },
    profile: { top: p.top, codes: p.codes },
  };
}
