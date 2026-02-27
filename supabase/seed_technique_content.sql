-- UPDATE all 20 techniques with steps, key_details, common_mistakes, positions_from
-- Uses technique name to identify each row. Adjust names if they differ in your DB.

-- 1. Closed Guard
UPDATE techniques SET
  steps = '1. Pull opponent into your closed guard and lock ankles behind their back
2. Control one wrist and grab the same-side collar or behind the head
3. Open guard and place foot on hip to create an angle
4. Re-close guard at the new angle with superior grips
5. Attack with sweeps, submissions, or transition to open guard',
  key_details = 'Keep your hips off the mat and angled, never flat on your back
Break posture immediately — pull their head to your chest
Control at least one grip at all times to limit their escape options
Use your legs actively to squeeze and control their posture',
  common_mistakes = 'Lying flat with hips square to the ceiling — kills your attack angles
Crossing ankles too low on their back — easy for them to posture up
Holding guard passively without attacking — gives them time to set up a pass
Neglecting grip fighting — letting them establish double grips first',
  positions_from = 'Pull Guard, Sweep Recovery, Takedown Defense'
WHERE name = 'Closed Guard';

-- 2. Scissor Sweep
UPDATE techniques SET
  steps = '1. From closed guard, get a cross-collar grip and a sleeve grip
2. Open your guard and place your shin across their stomach as a frame
3. Chop their far knee with your bottom leg while pulling with your grips
4. Drive your shin-frame forward as you scissor your legs
5. Follow the sweep and establish mount or side control',
  key_details = 'The cross-collar grip controls their posture throughout the sweep
Time the scissor motion — both legs must move simultaneously
Pull them forward and over your shin, not just sideways
Stay tight — do not create space between your body and theirs',
  common_mistakes = 'Placing the shin too high on the chest — no leverage to sweep
Forgetting to chop the knee — the sweep stalls without the bottom leg
Releasing grips during the sweep — they post and recover
Not following through to top position — ending up in a scramble',
  positions_from = 'Closed Guard'
WHERE name = 'Scissor Sweep';

-- 3. Hip Bump Sweep
UPDATE techniques SET
  steps = '1. From closed guard, time when opponent sits upright to create distance
2. Open guard and post on one hand behind you, sitting up explosively
3. Bump their chest with your hip and free arm, driving forward
4. Use the momentum to come on top into mount
5. Secure position and settle your weight',
  key_details = 'Timing is everything — attack when they posture up or sit back
Explode through the sweep — half-effort gets stuffed
Overhook their arm on the sweep side to prevent posting
If they resist, transition directly to a kimura or guillotine',
  common_mistakes = 'Telegraphing the sweep by sitting up slowly — they brace and block
Not committing fully — a lazy hip bump gets easily countered
Letting them post their hand — you must control or block the posting arm
Forgetting the chain — the hip bump alone is not enough at higher levels',
  positions_from = 'Closed Guard'
WHERE name = 'Hip Bump Sweep';

-- 4. Triangle Choke
UPDATE techniques SET
  steps = '1. From guard, control one wrist and push the other arm across their centerline
2. Shoot your hips up and lock your legs in a triangle around their head and one arm
3. Lock the figure-four by placing one ankle behind the opposite knee
4. Pull their head down and angle your hips perpendicular to their body
5. Squeeze your knees together and lift your hips for the finish',
  key_details = 'The angle is critical — cut a 90-degree angle to their body for maximum pressure
Pull the head down hard to tighten the choke
The trapped arm should cross their own neck to create the seal
Underhook their free leg to prevent them stacking you',
  common_mistakes = 'Not cutting the angle — a flat triangle has almost no choking power
Locking the triangle too loosely — gives them room to posture and escape
Forgetting to control posture — they stack you and pass
Crossing ankles instead of figure-four lock — no squeeze',
  positions_from = 'Closed Guard, Mount, Back Control'
WHERE name = 'Triangle Choke';

-- 5. Armbar from Guard
UPDATE techniques SET
  steps = '1. From guard, secure a strong cross-grip on their wrist and same-side collar
2. Place your foot on their hip and pivot your hips perpendicular
3. Swing your leg over their head while keeping the arm tight to your chest
4. Pinch your knees together and control their wrist with both hands
5. Bridge your hips upward against their elbow for the tap',
  key_details = 'Keep their arm glued to your chest — any space and they escape
Pinch knees tight around their shoulder to prevent them pulling out
Hips must be high and tight under their armpit
Bridge slowly and controlled for the finish — jerking risks injury',
  common_mistakes = 'Letting hips slide away from their shoulder — no leverage for the break
Crossing feet instead of pinching knees — they can spin out
Not controlling the thumb-up orientation of their hand — they rotate and escape
Rushing the hip pivot — telegraphs the attack and they posture away',
  positions_from = 'Closed Guard, Mount'
WHERE name = 'Armbar from Guard';

-- 6. Kimura from Guard
UPDATE techniques SET
  steps = '1. From closed guard, sit up and overhook their arm at the wrist
2. Feed your other hand under their arm to grip your own wrist (figure-four)
3. Fall back to guard while maintaining the grip
4. Flare your elbow out and rotate their arm behind their back
5. Control their body with your legs and apply slow pressure for the tap',
  key_details = 'The figure-four grip must be tight — wrist to wrist, no gaps
Keep your elbows pinched to your body as you rotate
Use your guard to control their posture and prevent stacking
The power comes from rotating their shoulder, not just pulling the wrist',
  common_mistakes = 'Gripping too far up their forearm — weak control and they slip out
Not controlling their posture — they stack and pass
Pulling straight instead of rotating — no shoulder lock pressure
Letting them straighten their arm — they can defend and escape',
  positions_from = 'Closed Guard, Half Guard, Side Control'
WHERE name = 'Kimura from Guard';

-- 7. Rear Naked Choke
UPDATE techniques SET
  steps = '1. From back control, secure a seatbelt grip (over-under on their torso)
2. Slide your choking arm under their chin with your bicep on one side of the neck
3. Place your choking hand on your opposite bicep
4. Put your free hand behind their head
5. Squeeze your elbows together and expand your chest for the choke',
  key_details = 'Get the chin — fight for the underhook on the neck before locking
Your hooks (or body triangle) must control their hips throughout
The squeeze comes from chest expansion, not just arm strength
Keep your head tight to theirs to prevent them peeling your arm',
  common_mistakes = 'Squeezing before the arm is under the chin — just a face crank
Loose hooks — they turn into you and escape back control
Reaching too far over — they catch your arm and defend
Not blocking their hand-fighting — they strip your grip before you lock it',
  positions_from = 'Back Control, Turtle'
WHERE name = 'Rear Naked Choke';

-- 8. Cross Collar Choke
UPDATE techniques SET
  steps = '1. From mount, feed your first hand deep into their far collar, thumb inside
2. Open their collar with your second hand and feed it deep on the other side
3. Drop your elbows to the mat beside their head
4. Sprawl your legs back to prevent the bridge escape
5. Pull your elbows apart while driving knuckles into their neck',
  key_details = 'Depth of grips is everything — get your hands past the tag at the back of the collar
Elbows must be tight and pointed down, not flared out
The choke is a pulling-apart motion, not a pushing motion
Works in gi only — requires deep collar grips',
  common_mistakes = 'Shallow grips — the choke has no power without deep collar control
Sitting too upright — they bump you off before you finish
Both hands on the same side of the neck — no cross pressure
Rushing the second grip — get the first one deep before committing',
  positions_from = 'Mount, Closed Guard'
WHERE name = 'Cross Collar Choke';

-- 9. Double Leg Takedown
UPDATE techniques SET
  steps = '1. Set up with a jab, collar tie, or level change to close distance
2. Drop your level by bending your knees, not your waist
3. Penetrate with a deep step between their legs
4. Wrap both arms behind their knees and clasp your hands
5. Drive forward with your shoulder in their hip, turn the corner, and take them down',
  key_details = 'The level change must be explosive — hesitation gets you sprawled on
Keep your head up and to the side, never down (guillotine risk)
Drive through them, not into them — your chest drives them backward
The penetration step is the most important part — commit fully',
  common_mistakes = 'Bending at the waist instead of the knees — slow and easy to sprawl
Head down — walking into a guillotine or front headlock
Stopping after the shot — you must drive through to finish
Reaching with arms instead of closing distance with your legs first',
  positions_from = 'Standing, Clinch'
WHERE name = 'Double Leg Takedown';

-- 10. Single Leg Takedown
UPDATE techniques SET
  steps = '1. Set up with inside hand fighting or a snap-down to expose the lead leg
2. Level change and shoot for their lead leg, wrapping behind the knee
3. Stand up with the leg tight to your chest, head on the inside
4. Run the pipe — drive forward while tripping their standing leg
5. Follow them to the mat and secure side control or pass',
  key_details = 'Head position on the inside is critical — prevents the whizzer counter
Clasp your hands and keep their leg pinched to your chest
Once you have the leg, stand up tall — do not stay on your knees
Use a trip, dump, or run-the-pipe finish depending on their reaction',
  common_mistakes = 'Head on the outside — easy for them to guillotine or sprawl
Staying on your knees with the leg — they whizzer and sprawl
Not standing up after the catch — gives them time to counter
Loose grip on the leg — they pull it out and reset',
  positions_from = 'Standing, Clinch'
WHERE name = 'Single Leg Takedown';

-- 11. Guard Pass (Knee Slice / Knee Cut)
UPDATE techniques SET
  steps = '1. From combat base inside their open guard, control their bottom knee
2. Slice your lead knee across their thigh, aiming for the mat on the far side
3. Use a cross-face or underhook to control their upper body
4. Drive your hips forward as your knee slides through
5. Clear their legs and consolidate side control',
  key_details = 'The cross-face is essential — it turns their head away and kills their frames
Keep heavy hip pressure as you slice through
Your trailing leg should backstep to prevent half guard recovery
Speed and pressure together — fast slice with heavy weight',
  common_mistakes = 'No cross-face — they frame and recover guard immediately
Knee slides too high on their body — you get stuck in half guard
Not clearing the bottom leg — they triangle or re-guard
Pausing mid-pass — momentum is key to finishing the slice',
  positions_from = 'Open Guard, Half Guard, Combat Base'
WHERE name = 'Knee Slice Pass';

-- 12. Toreando Pass (Bullfighter Pass)
UPDATE techniques SET
  steps = '1. From standing in their open guard, grip both pant legs at the knees
2. Push their knees to one side while stepping around to the other
3. Drop your chest onto theirs before they can re-guard
4. Establish a crossface or underhook as you settle
5. Secure side control with heavy hip pressure',
  key_details = 'Speed is the weapon — this pass relies on quickness not grinding
Push the legs past the point of no return before stepping
Land heavy on the chest — if you are light they will re-guard
Works best combined with other passes as part of a passing system',
  common_mistakes = 'Moving too slowly — they recover guard before you get around
Not controlling the legs long enough — they frame and re-guard
Landing with no pressure — floating above them instead of smashing
Only pushing legs one direction — becomes predictable',
  positions_from = 'Open Guard, Standing'
WHERE name = 'Toreando Pass';

-- 13. Mount Escape (Trap and Roll / Upa)
UPDATE techniques SET
  steps = '1. From bottom mount, trap one of their arms by hugging it to your chest
2. On the same side, hook their foot with your foot
3. Bridge explosively upward at a 45-degree angle toward the trapped side
4. Roll them over using the bridge momentum
5. Land in their closed guard and begin working to pass',
  key_details = 'Trap the arm AND the foot on the SAME side — both are required
Bridge at 45 degrees, not straight up — you need the angle to roll them
Explode with your hips — the power comes from the bridge, not your arms
Time it when they reach or post — catch the arm when it is available',
  common_mistakes = 'Bridging straight up — they just ride it and come back down
Forgetting to trap the foot — they base out and stay in mount
Trapping arm on one side and foot on the other — the angles conflict
Trying to push them off with arms instead of bridging — wastes energy',
  positions_from = 'Bottom Mount'
WHERE name = 'Mount Escape (Trap and Roll)';

-- 14. Side Control Escape (Shrimp / Elbow-Knee)
UPDATE techniques SET
  steps = '1. From bottom side control, frame against their neck and hip
2. Bridge into them to create a moment of space
3. Hip escape (shrimp) away, shooting your hips back
4. Insert your knee into the space between you and them
5. Recover to guard by closing your legs around them',
  key_details = 'Frames must be strong — forearm in the neck, hand on the hip
The bridge creates the space, the shrimp uses it — two separate moves
Get to your side, never stay flat on your back
Be patient and chain multiple shrimps if the first one is not enough',
  common_mistakes = 'Staying flat on your back — no ability to shrimp or create space
Pushing with arms only — wasting energy without bridging first
Not getting to your side — the shrimp only works from a side-facing position
Giving up after one attempt — side control escapes often take 2-3 shrimps',
  positions_from = 'Bottom Side Control'
WHERE name = 'Side Control Escape';

-- 15. Guillotine Choke
UPDATE techniques SET
  steps = '1. When opponent shoots or ducks their head, wrap your arm around their neck
2. Lock a chinstrap grip — blade of your wrist under their chin
3. Close your guard to control their body
4. Lean back slightly and arch your hips upward into their throat
5. Pull your elbow to your hip while squeezing your guard tight',
  key_details = 'The wrist blade must be directly under the chin, not on the side of the neck
Hips drive the choke — arch upward to create pressure
Keep your guard closed tight to prevent them passing
Can be finished standing, from guard, or from half guard',
  common_mistakes = 'Arm wrapped around the side of the neck — becomes a neck crank, not a choke
Not arching hips — the choke has no power without the hip drive
Loose guard — they pass to side control and escape the choke
Pulling with arms only — the finish requires hips and arms together',
  positions_from = 'Standing, Closed Guard, Front Headlock'
WHERE name = 'Guillotine Choke';

-- 16. Americana (Keylock)
UPDATE techniques SET
  steps = '1. From side control or mount, pin their wrist to the mat beside their head
2. Slide your other arm under their elbow, gripping your own wrist (figure-four)
3. Keep their elbow pinned to the mat with downward pressure
4. Slowly paint their hand toward their hip in an arc
5. Maintain the figure-four tight and apply steady pressure for the tap',
  key_details = 'Keep their elbow glued to the mat — the lock only works if the elbow stays down
The motion is a slow arc, like painting a rainbow from their head to their hip
Use your chest weight on their arm to keep it pinned
Works best from mount or side control where you have top pressure',
  common_mistakes = 'Letting their elbow lift off the mat — they can escape or straighten the arm
Cranking too fast — risk of injury, apply steady controlled pressure
Not using body weight — relying only on arm strength to pin their wrist
Going for it when they have frames in — clear their frames first',
  positions_from = 'Mount, Side Control'
WHERE name = 'Americana';

-- 17. Omoplata
UPDATE techniques SET
  steps = '1. From guard, control their wrist and open your guard
2. Swing your leg over their shoulder, placing your hamstring on their shoulder blade
3. Sit up and face the same direction as your opponent
4. Control their hip to prevent the roll escape
5. Lean forward over their trapped arm while walking your hips toward their head',
  key_details = 'Control their far hip — the most common escape is the forward roll
Sit up fully and get perpendicular to them before applying pressure
The finish is a forward lean, not a pull — your body weight does the work
If they roll, follow and maintain the shoulder lock throughout',
  common_mistakes = 'Not controlling the hip — they roll forward and escape easily
Staying on your back — you must sit up to finish
Not being perpendicular — wrong angle kills the shoulder pressure
Forgetting to break their posture first — they posture out before you lock it',
  positions_from = 'Closed Guard, Open Guard'
WHERE name = 'Omoplata';

-- 18. De La Riva Guard
UPDATE techniques SET
  steps = '1. From open guard, hook their lead leg with your outside foot behind their knee
2. Grip the ankle of the hooked leg with your same-side hand
3. Your other foot goes on their hip or bicep as a frame
4. Use your free hand for a collar grip, sleeve grip, or belt grip
5. Off-balance them with push-pull and attack sweeps or back takes',
  key_details = 'The DLR hook must be deep — your foot wraps behind their knee fully
Ankle grip on the hooked leg is essential — controls their base
Use the hip foot to manage distance and prevent them smashing
This is a dynamic guard — constantly threaten sweeps and back takes',
  common_mistakes = 'Shallow hook — they easily strip it and start passing
No ankle grip — the hook alone is not enough to control them
Lying flat — stay on your side with active hips
Being passive — DLR requires constant off-balancing to be effective',
  positions_from = 'Open Guard, Guard Pull'
WHERE name = 'De La Riva Guard';

-- 19. Half Guard Sweep (Old School Sweep)
UPDATE techniques SET
  steps = '1. From bottom half guard, underhook their far arm deeply
2. Get on your side facing them — never stay flat
3. Drive into them with the underhook, getting your head under their armpit
4. Come to your knees while keeping their leg trapped
5. Run your hips forward and take them over to land in top half or side control',
  key_details = 'The underhook is the most important grip — fight hard to get it
Get on your side immediately — flat half guard is a dead position
Your head goes under their armpit — this controls their weight
Use a knee shield first to create space, then replace it with the underhook',
  common_mistakes = 'Staying flat — they crossface you and you cannot move
Weak underhook — they whizzer and flatten you back out
Not getting on your side — the sweep does not work from a flat position
Letting go of the leg — you need the half guard hook to anchor the sweep',
  positions_from = 'Bottom Half Guard'
WHERE name = 'Half Guard Sweep';

-- 20. Back Take from Turtle
UPDATE techniques SET
  steps = '1. From the top position against their turtle, establish a seatbelt grip
2. Insert your near-side hook (foot between their thigh and calf)
3. Sit to the hook side, pulling them onto your lap
4. Insert the second hook as they roll onto you
5. Lock both hooks and secure back control with the seatbelt grip',
  key_details = 'The seatbelt grip (over-under) must be established before inserting hooks
Always insert the bottom hook first — it anchors the position
Sit to the side, do not try to roll them backward over you
Keep your chest glued to their back throughout the transition',
  common_mistakes = 'Jumping on their back without hooks — they shake you off easily
Inserting the top hook first — no anchor and you slide off
Loose seatbelt — they peel your arms and turn into you
Sitting straight back instead of to the side — they roll and end up on top',
  positions_from = 'Turtle (Top), Side Control'
WHERE name = 'Back Take from Turtle';
