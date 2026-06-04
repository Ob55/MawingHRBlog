/* automation/articles.js
 *
 * The pre-written article bank that powers the weekly auto-publisher.
 *
 * Each entry is one complete, ready-to-publish article. The weekly runner
 * (publish-weekly.js) walks this list in order, skips anything already published,
 * and publishes the next unused one. There is NO AI call at runtime — these
 * articles are written by hand so publishing is free, deterministic and offline-safe.
 *
 * Fields (match the /api/upload contract in ../api/upload.js):
 *   title            — headline (<=160 chars). Also used as the image alt text by the public site.
 *   author           — byline shown nowhere public yet, but stored on the post.
 *   shortDescription — card/excerpt teaser (<=280 chars).
 *   body             — full article as HTML (the public site renders this as trusted Quill-style HTML).
 *   imageQuery       — search phrase sent to Pexels to pick a relevant HD cover image.
 *
 * To extend the bank: append more objects in the same shape (ask Claude to "write 20 more").
 * Order matters only in that earlier entries publish first; titles must stay unique.
 *
 * Note on statutory figures: Kenyan rates (NSSF, SHIF, PAYE bands, Housing Levy) change
 * periodically. Articles deliberately explain the mechanics and point readers to confirm
 * current rates with KRA / the relevant authority rather than hard-coding numbers that age.
 */

const AUTHOR = 'Mawingu HR Solutions';

const articles = [
  {
    title: 'The Employment Contract Every Kenyan SME Should Get Right',
    author: AUTHOR,
    imageQuery: 'business contract signing office',
    shortDescription:
      'A written contract is not red tape — under the Employment Act it is the foundation of a fair, dispute-proof working relationship. Here is what every small business in Kenya should put in writing before day one.',
    body: `
<p>One of the most common — and most expensive — mistakes we see in growing Kenyan businesses is the handshake hire. A promising candidate is brought on, work begins, and nobody ever writes anything down. It feels efficient. It is, in fact, the single biggest source of HR disputes we are called in to untangle.</p>
<p>Kenya's Employment Act, 2007 expects that any employee engaged for more than three months has the main terms of their employment in writing. Beyond the legal requirement, a clear contract protects <em>both</em> sides: the employee knows what they are owed, and the employer knows exactly what was agreed when a disagreement arises.</p>
<h2>What a sound contract must cover</h2>
<p>At minimum, a written contract for a Kenyan employee should state:</p>
<ul>
  <li><strong>The parties and start date</strong> — the legal name of the business and the employee, and when employment begins.</li>
  <li><strong>Job title and duties</strong> — a realistic description of the role, with room for reasonable additional tasks.</li>
  <li><strong>Place of work</strong> — including whether the role is on-site, remote or hybrid.</li>
  <li><strong>Remuneration</strong> — gross pay, pay frequency, and any allowances or benefits, plus a note that statutory deductions apply.</li>
  <li><strong>Working hours</strong> — normal hours, rest days, and how overtime is handled.</li>
  <li><strong>Leave entitlements</strong> — annual, sick, and where relevant maternity and paternity leave.</li>
  <li><strong>Probation</strong> — its length and the notice that applies during it.</li>
  <li><strong>Termination and notice</strong> — the notice period each side must give.</li>
</ul>
<h2>Where small businesses slip up</h2>
<p>Three avoidable errors come up again and again:</p>
<blockquote>Vague duties, no probation clause, and a pay figure that confuses gross and net. Each one becomes the exact point of dispute six months later.</blockquote>
<p>Be specific about gross pay and make clear that PAYE, SHIF, NSSF and the Housing Levy are deducted from it. Define the probation period openly rather than leaving it implied. And avoid copy-pasting a contract from the internet that references the wrong jurisdiction — a Kenyan contract should reflect Kenyan law.</p>
<h2>A contract is a living document</h2>
<p>When a role changes materially — a promotion, a new pay structure, a move to hybrid work — update the contract or issue a written variation. Both parties should sign. This habit keeps your records clean and makes any future review, audit or dispute dramatically simpler.</p>
<p>If you are unsure whether your current templates hold up, a short contract review is one of the highest-return hours a small business owner can spend. Clarity on paper today prevents a costly argument tomorrow.</p>
`.trim(),
  },

  {
    title: 'Understanding Statutory Deductions: NSSF, SHIF, PAYE and the Housing Levy',
    author: AUTHOR,
    imageQuery: 'payroll accounting calculator desk',
    shortDescription:
      'Every payslip in Kenya carries four core statutory deductions. Getting them right keeps you compliant and your team trusting their numbers. A plain-language guide for SME owners and first-time employers.',
    body: `
<p>For a founder running payroll for the first time, the alphabet soup of Kenyan statutory deductions can be intimidating: NSSF, SHIF, PAYE, the Housing Levy. Get them wrong and you face penalties; get them confusing and you erode your team's trust in their own payslips. Here is the plain-language version.</p>
<h2>The four deductions you need to know</h2>
<h3>1. PAYE (Pay As You Earn)</h3>
<p>This is income tax, deducted by the employer and remitted to the Kenya Revenue Authority (KRA). It is calculated on a graduated scale, so higher earnings are taxed at higher bands, and employees are entitled to a personal relief. Because the bands and reliefs are set by KRA and revised from time to time, always calculate PAYE against the <strong>current</strong> KRA tax bands.</p>
<h3>2. SHIF (Social Health Insurance Fund)</h3>
<p>SHIF replaced the former NHIF as the vehicle for the Social Health Insurance Act. Contributions are based on gross salary and fund access to healthcare. Employers deduct and remit on behalf of staff. Confirm the prevailing contribution rate, as it is set by regulation.</p>
<h3>3. NSSF (National Social Security Fund)</h3>
<p>NSSF is a retirement savings contribution under the NSSF Act, 2013, which moved Kenya to a tiered, percentage-based system that has been phased in over several years. Both employer and employee contribute. Check which tier limits currently apply so your deductions and your matching employer contribution are accurate.</p>
<h3>4. The Affordable Housing Levy</h3>
<p>The Housing Levy is charged on gross pay, with a matching employer contribution, and is remitted alongside other statutory payments. As with the others, apply the current statutory rate.</p>
<h2>Employer obligations beyond deducting</h2>
<p>Deducting is only half the job. As an employer you must also:</p>
<ul>
  <li>Remit each deduction to the right body by its monthly deadline.</li>
  <li>Add the employer's own contributions where they apply (NSSF and Housing Levy).</li>
  <li>Keep clear records and issue payslips that itemise every deduction.</li>
  <li>Stay current as rates and bands change — they do, regularly.</li>
</ul>
<blockquote>The cost of a late or missed remittance is rarely just the penalty. It is the time, stress and reputational risk of putting it right.</blockquote>
<h2>Make it routine, not heroic</h2>
<p>The businesses that handle statutory deductions calmly are the ones that systematise them: a reliable payroll process, a fixed monthly remittance calendar, and a habit of confirming current rates each financial year. If payroll is eating your week, it is often the clearest signal that it is time to bring in structured HR and payroll support.</p>
<p><em>This article explains the mechanics of statutory deductions. For the exact current rates and bands, confirm with KRA and the relevant authorities or a qualified payroll professional.</em></p>
`.trim(),
  },

  {
    title: 'Probation Periods: How to Use Them Fairly and Legally',
    author: AUTHOR,
    imageQuery: 'new employee meeting manager office',
    shortDescription:
      'Probation is your structured chance to confirm a hire is right — but only if you use it deliberately. How Kenyan SMEs can run probation that protects the business and treats new staff fairly.',
    body: `
<p>Probation is one of the most useful tools an employer has, and one of the most wasted. Used well, it is a structured window to confirm that a new hire can actually do the job before the relationship becomes permanent. Used carelessly — as a box ticked and forgotten — it offers no protection at all.</p>
<h2>What probation is for</h2>
<p>A probation period lets both sides test the fit. The employer assesses competence, reliability and culture; the employee decides whether the role is what they expected. Under Kenya's Employment Act, probationary contracts carry their own, shorter notice arrangements, and there are limits on how long probation can run and be extended. Always state the probation length clearly in the contract.</p>
<h2>Running probation that actually works</h2>
<p>The mistake is treating probation as a silent countdown. Instead, make it active:</p>
<ul>
  <li><strong>Set expectations on day one.</strong> Write down what success looks like in the first 30, 60 and 90 days.</li>
  <li><strong>Check in regularly.</strong> Short, honest conversations beat one surprise verdict at the end.</li>
  <li><strong>Document performance.</strong> Keep simple notes of what is going well and where support is needed.</li>
  <li><strong>Decide deliberately.</strong> Confirm, extend (within the legal limit and for a genuine reason), or part ways — but make it a decision, not a default.</li>
</ul>
<blockquote>If you reach the end of probation and cannot say clearly whether the person is succeeding, the failure is usually in the process, not the person.</blockquote>
<h2>Ending employment during probation</h2>
<p>Even during probation, fairness matters. While the procedural bar is lower than for a confirmed employee, you should still give the agreed notice, communicate honestly, and avoid any decision that could look discriminatory. A brief, respectful conversation explaining why the role is not working protects both your reputation and your legal position.</p>
<h2>Confirmation should mean something</h2>
<p>When an employee passes probation, mark it. A short confirmation letter updating their status — and any change in notice or benefits — signals that the milestone is real and that you run a deliberate, professional operation. That signal is exactly the kind of structure that helps small businesses retain good people.</p>
`.trim(),
  },

  {
    title: 'Leave Entitlements in Kenya: Annual, Sick, Maternity and Paternity',
    author: AUTHOR,
    imageQuery: 'calendar planning vacation desk',
    shortDescription:
      'Leave is a legal entitlement, not a favour — and clarity around it is one of the cheapest ways to build trust with your team. A practical guide to getting leave right in a Kenyan SME.',
    body: `
<p>Few HR topics generate more friction in small businesses than leave. An employee assumes one thing, the owner assumes another, and a disagreement that should never have happened sours an otherwise good relationship. The fix is almost always the same: write the policy down, base it on the law, and apply it consistently.</p>
<h2>The core entitlements</h2>
<h3>Annual leave</h3>
<p>The Employment Act provides a minimum annual leave entitlement that accrues with service. Many employers offer more than the minimum as a retention benefit, which is perfectly fine — what matters is that the entitlement is clear and that it is honoured. Decide and document how leave accrues, whether it can be carried over, and how it is paid out on exit.</p>
<h3>Sick leave</h3>
<p>Employees are entitled to sick leave, typically supported by a medical certificate, after a qualifying period of service. Be clear about how many days are at full pay and how staff should notify you when they are unwell.</p>
<h3>Maternity leave</h3>
<p>Female employees are entitled to a statutory period of maternity leave on full pay, with the right to return to the same or an equivalent role. Plan cover early and treat the return-to-work transition with care — it is a moment that strongly shapes loyalty.</p>
<h3>Paternity leave</h3>
<p>Male employees are entitled to a shorter statutory period of paternity leave on full pay around the birth of their child.</p>
<h2>Why a written leave policy pays for itself</h2>
<blockquote>A one-page leave policy prevents more disputes than almost any other document in a small business.</blockquote>
<p>A good policy answers the questions before they are asked:</p>
<ul>
  <li>How is leave requested and approved?</li>
  <li>How much notice should staff give?</li>
  <li>What happens to unused leave at year-end and on resignation?</li>
  <li>How are public holidays and leave interactions handled?</li>
</ul>
<h2>Consistency is the whole game</h2>
<p>The fastest way to lose your team's trust is to grant leave generously to some and grudgingly to others. Once your policy is written, apply it evenly. Keep a simple, accurate leave record for every employee so balances are never in dispute. That predictability is exactly what makes a small workplace feel fair — and fair workplaces keep their people.</p>
<p><em>Confirm the current statutory minimums under the Employment Act when setting your figures, as entitlements are defined by law.</em></p>
`.trim(),
  },

  {
    title: 'Fair Termination and Redundancy: Getting the Process Right',
    author: AUTHOR,
    imageQuery: 'serious business meeting discussion',
    shortDescription:
      'In Kenya, how you end employment matters as much as why. Most unfair-dismissal claims are won or lost on procedure. A clear, humane guide to terminating and declaring redundancy lawfully.',
    body: `
<p>Ending someone's employment is the hardest thing an employer does, and the area where small businesses are most exposed. In Kenya, the law is clear that a dismissal must be both <strong>substantively fair</strong> (a valid reason) and <strong>procedurally fair</strong> (a proper process). Many employers have a genuinely valid reason and still lose a claim — purely because they skipped the procedure.</p>
<h2>The two tests you must pass</h2>
<h3>1. A valid reason</h3>
<p>The reason must fall within accepted grounds: misconduct, poor performance, or operational requirements such as genuine redundancy. "I just felt it wasn't working" is not, on its own, a defensible reason.</p>
<h3>2. A fair process</h3>
<p>This is where cases are decided. For misconduct or performance, the employee is generally entitled to:</p>
<ul>
  <li>To be told the specific allegation or concern, in advance and in writing.</li>
  <li>A hearing where they can respond, accompanied if they wish.</li>
  <li>Genuine consideration of their explanation before any decision.</li>
  <li>The decision communicated, with the right to appeal where appropriate.</li>
</ul>
<blockquote>Document every step. In a dispute, the question is rarely "what happened?" — it is "what can you prove you did?"</blockquote>
<h2>Redundancy is a special case</h2>
<p>Redundancy is termination because the role — not the person — is no longer needed. It carries its own procedural obligations, including notice to the employee and the labour office, fair and objective selection criteria, and payment of the redundancy entitlements due under the law, such as severance based on years of service and any leave owed.</p>
<p>Cutting corners here is costly. Selection that looks arbitrary or personal is the fastest route to a successful claim.</p>
<h2>Do it lawfully, and do it humanely</h2>
<p>Compliance and compassion are not in tension. Give honest reasons, follow the process, pay what is owed promptly, and treat the departing person with dignity. How you handle an exit is watched closely by everyone who stays — it tells them exactly what kind of employer you are.</p>
<p><em>Termination law is fact-specific. For any significant or contested case, take tailored advice before you act.</em></p>
`.trim(),
  },

  {
    title: 'Writing a Staff Handbook Your Small Team Will Actually Read',
    author: AUTHOR,
    imageQuery: 'employee handbook documents office',
    shortDescription:
      'A staff handbook turns "how we do things here" from guesswork into shared, written expectations. How to build one that fits a small Kenyan business — clear, practical, and short enough to be used.',
    body: `
<p>"Do we need a staff handbook? We're only twelve people." Yes — and that is exactly why. In a small team, the rules live in the founder's head, which means they change with mood, memory and who is asking. A handbook makes expectations explicit, consistent and fair. It is the difference between a workplace that runs on whim and one that runs on structure.</p>
<h2>What a good handbook does</h2>
<p>It answers the everyday questions before they become arguments, and it codifies your values so culture survives growth. Crucially for a small business, it also protects you: when expectations are written and acknowledged, enforcing them is fair and defensible.</p>
<h2>What to include</h2>
<ul>
  <li><strong>Welcome and values</strong> — who you are and how you expect people to treat each other.</li>
  <li><strong>Working hours and attendance</strong> — start times, flexibility, remote/hybrid arrangements.</li>
  <li><strong>Leave</strong> — how to request it, notice periods, and how balances work.</li>
  <li><strong>Conduct</strong> — a simple code covering professionalism, confidentiality and use of company resources.</li>
  <li><strong>Disciplinary and grievance process</strong> — how concerns are raised and handled on both sides.</li>
  <li><strong>Pay and benefits</strong> — pay dates, payslips, and any benefits you offer.</li>
  <li><strong>Health, safety and wellbeing</strong> — basic obligations and who to talk to.</li>
</ul>
<blockquote>The best handbook is the one people actually read. Keep it human, keep it short, and cut the legalese.</blockquote>
<h2>Make it Kenyan and make it yours</h2>
<p>A handbook should reflect Kenyan employment law and your real way of working — not a generic template from another country. Write it in plain language, use your own examples, and make sure nothing in it contradicts the Employment Act or individual contracts.</p>
<h2>Treat it as living</h2>
<p>Have every employee acknowledge the handbook in writing, then review it once a year. As the law shifts and your business grows, update the relevant sections rather than letting the document drift out of date. A handbook that is current is an asset; one that is ignored is a liability. Done well, it is one of the highest-leverage hours of structure a growing business can invest in.</p>
`.trim(),
  },

  {
    title: 'Onboarding That Makes New Hires Productive — and Loyal — Fast',
    author: AUTHOR,
    imageQuery: 'welcome new team member office',
    shortDescription:
      'The first two weeks decide whether a new hire thrives or quietly checks out. A practical onboarding playbook for small businesses that turns good recruitment into lasting performance.',
    body: `
<p>You spent weeks finding the right person. Then on day one they arrive to a missing laptop, no clear plan, and a vague "just settle in." It happens constantly in busy small businesses — and it quietly undoes all the effort that went into hiring. Onboarding is where recruitment either pays off or leaks away.</p>
<h2>Why onboarding is a business decision, not an HR formality</h2>
<p>Research across many markets points the same way: employees who experience structured onboarding become productive faster and stay significantly longer. For a small business, where every hire carries real weight, that retention is not a nice-to-have — it is the return on your recruitment investment.</p>
<h2>The three phases of good onboarding</h2>
<h3>Before they start</h3>
<ul>
  <li>Confirm the start date, hours and first-day logistics in writing.</li>
  <li>Have their workspace, accounts and tools ready before they walk in.</li>
  <li>Tell the team who is joining and what they will do.</li>
</ul>
<h3>The first week</h3>
<ul>
  <li>Give a warm welcome and a clear plan for the week.</li>
  <li>Walk through the role, expectations and the staff handbook.</li>
  <li>Introduce key people and explain how work actually flows.</li>
  <li>Assign a buddy — someone they can ask the "silly" questions.</li>
</ul>
<h3>The first 90 days</h3>
<ul>
  <li>Set clear goals for the first month and quarter.</li>
  <li>Hold regular check-ins (these double as your probation reviews).</li>
  <li>Give early, specific feedback so small issues never grow.</li>
</ul>
<blockquote>People decide how they feel about a job long before their first formal review. Onboarding is where that judgement is formed.</blockquote>
<h2>You do not need a big budget — you need a checklist</h2>
<p>The single most effective onboarding tool for a small business is a simple, repeatable checklist that nothing falls off. It costs nothing and signals everything: that you are organised, that you were expecting them, and that they made the right choice. Get the first two weeks right and you convert a nervous newcomer into a confident, committed member of the team.</p>
`.trim(),
  },

  {
    title: 'Performance Management Without the Bureaucracy',
    author: AUTHOR,
    imageQuery: 'manager feedback conversation employee',
    shortDescription:
      'You do not need a corporate appraisal system to manage performance well. How small Kenyan businesses can build a light, honest rhythm of feedback that lifts results without drowning in paperwork.',
    body: `
<p>Say "performance management" to most small business owners and they picture a thick appraisal form filled in once a year and immediately forgotten. No wonder they avoid it. But the goal is not paperwork — it is a simple, honest rhythm that helps people do their best work. That you can absolutely build, at any size.</p>
<h2>The problem with the annual review</h2>
<p>The once-a-year appraisal fails for an obvious reason: feedback that arrives months late cannot change anything. By the time a problem is raised, it has either festered or been forgotten, and the employee feels ambushed. Good performance management is continuous, not ceremonial.</p>
<h2>A lightweight system that works</h2>
<h3>1. Set clear expectations</h3>
<p>People cannot hit a target they cannot see. For each role, agree a handful of clear, meaningful objectives. Three to five real priorities beat twenty vague ones.</p>
<h3>2. Have regular one-to-ones</h3>
<p>A short, consistent monthly conversation — what is going well, what is stuck, what support is needed — does more than any annual form. It catches problems early and builds trust.</p>
<h3>3. Give feedback in the moment</h3>
<p>Praise good work when you see it and address concerns promptly and privately. Specific, timely feedback is a gift; saved-up criticism is an ambush.</p>
<h3>4. Keep a light record</h3>
<p>Jot down key points from your check-ins. It need not be elaborate — but if performance ever becomes a formal issue, that simple trail is invaluable.</p>
<blockquote>Manage performance like a series of small, honest conversations, not one big annual verdict.</blockquote>
<h2>When performance is genuinely poor</h2>
<p>If someone is consistently underperforming despite support, move to a clear, documented process: name the gap, agree a plan with a realistic timeframe, offer help, and follow up. This is fairer to the employee and, should it ever come to termination, essential to doing it lawfully.</p>
<h2>The real payoff</h2>
<p>Done lightly and consistently, performance management is not about catching people out — it is about helping good people get better and giving everyone a clear sense of how they are doing. That clarity is one of the strongest drivers of both results and retention in a small team.</p>
`.trim(),
  },

  {
    title: 'Handling Workplace Disputes and Disciplinary Issues Calmly',
    author: AUTHOR,
    imageQuery: 'workplace mediation discussion table',
    shortDescription:
      'Conflict in a small team feels personal and high-stakes. A clear, fair process takes the heat out of it — protecting relationships and the business. How to handle grievances and discipline with structure.',
    body: `
<p>In a ten-person business, a dispute between two colleagues is not a private matter — it ripples through the whole team within days. That intimacy is exactly why small businesses need a clear process for handling conflict and discipline. Structure is what lets you address problems firmly <em>and</em> fairly, without it becoming personal.</p>
<h2>Two different processes</h2>
<p>It helps to separate two things that often get tangled:</p>
<ul>
  <li><strong>Grievances</strong> — concerns an employee raises (about treatment, workload, a colleague, pay).</li>
  <li><strong>Disciplinary matters</strong> — concerns the employer raises about an employee's conduct or performance.</li>
</ul>
<p>Both deserve a defined, written route so people know how issues are handled before one arises.</p>
<h2>A fair disciplinary process</h2>
<p>When you need to address misconduct or poor performance, follow a consistent path:</p>
<ul>
  <li><strong>Investigate first.</strong> Establish the facts calmly before reaching any conclusion.</li>
  <li><strong>Put it in writing.</strong> Tell the employee the specific concern in advance.</li>
  <li><strong>Hold a hearing.</strong> Give them a real chance to respond, accompanied if they wish.</li>
  <li><strong>Decide proportionately.</strong> Match the outcome to the issue — a warning for a first minor lapse, not instant dismissal.</li>
  <li><strong>Allow an appeal.</strong> Where appropriate, let them challenge the decision.</li>
</ul>
<blockquote>Fairness is not softness. A firm decision reached through a fair process is far stronger — legally and morally — than a harsh one reached in a hurry.</blockquote>
<h2>Handling grievances well</h2>
<p>When an employee raises a concern, take it seriously, listen without defensiveness, investigate where needed, and respond. Even when you cannot give them the outcome they wanted, being genuinely heard changes how people feel about the workplace.</p>
<h2>Why process protects everyone</h2>
<p>A documented, consistently applied process does three things at once: it resolves the immediate issue fairly, it protects the business if a matter ever escalates legally, and it signals to the whole team that this is a workplace where things are handled properly. In a small business, that reputation for fairness is one of your most valuable assets.</p>
`.trim(),
  },

  {
    title: 'Building Culture in a Small Team — On Purpose, Not by Accident',
    author: AUTHOR,
    imageQuery: 'happy diverse team collaboration office',
    shortDescription:
      'Every business has a culture whether it chooses one or not. For small Kenyan companies, culture is the real competitive edge against bigger rivals. How to shape it deliberately as you grow.',
    body: `
<p>Culture is not the perk shelf or the team lunch. It is the sum of the behaviours your business actually rewards, tolerates and ignores. Every company has one — the only question is whether yours is the result of deliberate choices or whatever happened to take root. For a small business, getting this right is not soft stuff; it is often your sharpest edge against larger competitors.</p>
<h2>Why culture is a small-business advantage</h2>
<p>You cannot always outspend a bigger rival on salary. But you can offer something they often cannot: a workplace where people feel seen, trusted and part of something. That is why talented people frequently choose a strong small team over a faceless large one — and why a deliberate culture is a genuine recruitment and retention weapon.</p>
<h2>Culture is built by what you do, not what you say</h2>
<blockquote>Your values are not what you write on the wall. They are what you reward, what you tolerate, and what you walk past.</blockquote>
<p>If you say you value respect but tolerate a high performer who belittles colleagues, your real value is "results excuse rudeness" — and everyone learns it fast. Shaping culture means aligning your daily decisions with the behaviours you claim to care about.</p>
<h2>Practical levers for a small team</h2>
<ul>
  <li><strong>Hire for values, not just skills.</strong> Skills can be taught; a poor attitude spreads.</li>
  <li><strong>Model the behaviour yourself.</strong> In a small team, the founder's conduct <em>is</em> the culture.</li>
  <li><strong>Recognise the right things.</strong> Praise the behaviours you want repeated, publicly and specifically.</li>
  <li><strong>Address misalignment quickly.</strong> One unchecked toxic dynamic can undo months of good work.</li>
  <li><strong>Give people a voice.</strong> Ask for input and act on it visibly.</li>
</ul>
<h2>Protect it as you grow</h2>
<p>Culture is most fragile during growth. Each new hire either reinforces or dilutes it, and the informal habits that worked at five people break at twenty. This is exactly when light structure — clear values, fair processes, a real onboarding experience — stops being optional and starts being the thing that keeps your culture intact. Build it on purpose, and it becomes the reason good people join you and stay.</p>
`.trim(),
  },

  {
    title: 'When Should Your Business Hire HR — or Outsource It?',
    author: AUTHOR,
    imageQuery: 'business owner planning office desk',
    shortDescription:
      'Founders often handle HR themselves until it quietly becomes a liability. How to recognise the signals that you need dedicated HR support, and how to choose between hiring in-house and outsourcing.',
    body: `
<p>In the early days, the founder is the HR department — hiring, paying, settling disputes, all between everything else. It works, until it doesn't. The hard part is spotting the moment when ad-hoc HR stops being scrappy and starts being a genuine risk to the business.</p>
<h2>The signals it is time</h2>
<p>You are likely past the DIY stage when you notice several of these:</p>
<ul>
  <li><strong>HR admin is eating your week.</strong> Payroll, leave and queries are crowding out the work only you can do.</li>
  <li><strong>You are unsure about compliance.</strong> Contracts, deductions and termination rules have become a source of anxiety rather than confidence.</li>
  <li><strong>People issues are recurring.</strong> Disputes, turnover or performance problems keep surfacing.</li>
  <li><strong>You are growing fast.</strong> Crossing roughly 10–15 employees, informal habits start to break.</li>
  <li><strong>A near-miss scared you.</strong> A disgruntled exit or a compliance scramble showed you how exposed you were.</li>
</ul>
<blockquote>The cost of getting HR wrong — a successful claim, a key resignation, a compliance penalty — almost always dwarfs the cost of getting help.</blockquote>
<h2>In-house or outsourced?</h2>
<h3>Hiring an in-house HR person</h3>
<p>Makes sense once you have the headcount and ongoing volume to justify a full role — often around 30–50 employees, depending on complexity. You gain someone embedded in the culture and always on hand. The trade-off is salary, and the risk of hiring a generalist who lacks deep expertise in specific areas.</p>
<h3>Outsourcing to an HR partner</h3>
<p>Often the smarter first step for SMEs. You get professional expertise across contracts, payroll, compliance and disputes — at a fraction of a full salary — and you can scale the support up or down as you grow. It is especially valuable for the high-stakes, occasional tasks (a tricky termination, a policy overhaul) where getting it wrong is expensive.</p>
<h2>The real question</h2>
<p>It is not "can I keep doing this myself?" — you probably can, for a while. It is "what is the cost of my attention, and the risk of a mistake, the longer I do?" For most growing businesses, structured HR support pays for itself the first time it prevents a single costly error.</p>
`.trim(),
  },

  {
    title: 'Managing Remote and Hybrid Teams in Kenya',
    author: AUTHOR,
    imageQuery: 'remote work laptop home office video call',
    shortDescription:
      'Remote and hybrid work are now permanent features of the Kenyan workplace. How small businesses can manage distributed teams well — covering performance, fairness, compliance and connection.',
    body: `
<p>Remote and hybrid working moved from emergency measure to permanent expectation faster than anyone planned. For Kenyan SMEs, it is an opportunity — access to talent beyond your immediate location, lower overheads — but only if you manage it deliberately. Distance amplifies whatever your management habits already are: good ones get better, sloppy ones get exposed.</p>
<h2>Manage output, not presence</h2>
<p>The instinct to monitor whether people are "online" is the fastest way to kill a remote team's morale and your own time. Shift the focus from hours seen to work delivered. Set clear goals and deadlines, then trust people to meet them. If someone's output is good, where they sit is irrelevant; if it is poor, that is a performance conversation, not a surveillance one.</p>
<h2>Communication has to be designed</h2>
<p>In an office, coordination happens by accident — overheard conversations, quick desk-side questions. Remotely, you have to build it on purpose:</p>
<ul>
  <li>Agree which channel is for what (quick chat vs. decisions vs. urgent issues).</li>
  <li>Keep a predictable rhythm of check-ins and team updates.</li>
  <li>Write things down — decisions, expectations, who owns what.</li>
  <li>Protect against isolation with deliberate, human connection, not just work talk.</li>
</ul>
<blockquote>Remote work does not fail because of technology. It fails because of unclear expectations and absent communication.</blockquote>
<h2>Keep it fair — and compliant</h2>
<p>Hybrid arrangements can quietly create two tiers: the in-office crowd who get noticed and the remote staff who get overlooked for recognition and growth. Watch for it actively. And remember that your legal obligations do not change because someone works from home — contracts, working-hour expectations, statutory deductions, leave and a duty of care all still apply. Put the remote/hybrid arrangement in writing so expectations are explicit.</p>
<h2>The payoff for getting it right</h2>
<p>Done well, flexible work is a powerful retention and recruitment tool for a small business. The companies that win with it are not the ones with the fanciest tools — they are the ones with the clearest expectations, the most deliberate communication, and a genuine focus on results over optics.</p>
`.trim(),
  },

  {
    title: 'Preventing Burnout and Protecting Wellbeing in a Small Team',
    author: AUTHOR,
    imageQuery: 'calm wellbeing workplace relaxed',
    shortDescription:
      'In a lean team, one burnt-out employee affects everyone — and the founder is often most at risk. Practical, low-cost ways small Kenyan businesses can protect wellbeing and sustain performance.',
    body: `
<p>Burnout is not a sign of weakness, and it is not solved by a wellness poster. It is what happens when sustained pressure meets too little recovery — and in a small, lean team, it is both more likely and more damaging, because there is no bench to absorb the loss when someone hits the wall. Protecting wellbeing is not a perk; it is how you protect performance.</p>
<h2>Why small businesses are especially exposed</h2>
<p>In a big company, a struggling employee can sometimes coast unnoticed. In a team of eight, everyone carries real load, and one person quietly burning out drags down the whole group. The founder, meanwhile, is often the most overworked person in the building and the least likely to admit it.</p>
<h2>Spot the early signs</h2>
<p>Burnout rarely announces itself. Watch for the quiet signals:</p>
<ul>
  <li>A normally reliable person becoming withdrawn, cynical or irritable.</li>
  <li>Dropping quality or missed deadlines from someone usually dependable.</li>
  <li>Creeping absenteeism, or the opposite — never switching off.</li>
  <li>Visible exhaustion that does not lift after a weekend.</li>
</ul>
<h2>Practical, low-cost prevention</h2>
<blockquote>You cannot meditate your way out of an unmanageable workload. Wellbeing starts with how the work is designed.</blockquote>
<ul>
  <li><strong>Manage workload honestly.</strong> The biggest driver of burnout is sustained, unrealistic demand. Prioritise ruthlessly and protect people from permanent overload.</li>
  <li><strong>Respect time off.</strong> Make sure people actually take their leave, and resist the creep of after-hours messages becoming the norm.</li>
  <li><strong>Give autonomy and clarity.</strong> Powerlessness and confusion are exhausting; clear goals and trust are energising.</li>
  <li><strong>Talk about it.</strong> A simple, regular "how are you really doing?" catches problems early.</li>
  <li><strong>Model it from the top.</strong> If the founder never rests, no one else feels permitted to.</li>
</ul>
<h2>Wellbeing is a business strategy</h2>
<p>A rested, supported team is more creative, more productive and far less likely to walk out the door — and the cost of replacing a key person who burns out is enormous for a small business. Looking after your people's wellbeing is not at odds with running a tight operation. It is one of the smartest, cheapest investments in sustained performance you can make.</p>
`.trim(),
  },

  {
    title: 'Recruiting Your First Employees: A Practical Guide for Founders',
    author: AUTHOR,
    imageQuery: 'job interview candidate handshake office',
    shortDescription:
      'Your first hires shape your business more than any later ones. A structured, practical approach to recruiting well when you have no HR team and cannot afford a bad hire.',
    body: `
<p>The first few people you hire will define your business — its capability, its culture and its trajectory — more profoundly than any hire you make later. Yet most founders recruit on instinct, under time pressure, with no process. When a bad hire in a small team can cost months of salary and momentum, that is a gamble worth de-risking.</p>
<h2>Start with the role, not the person</h2>
<p>Before posting anything, get clear on what you are actually hiring for:</p>
<ul>
  <li>What outcomes must this person deliver in their first year?</li>
  <li>Which skills are essential versus nice-to-have?</li>
  <li>What does the role pay, realistically, for your market?</li>
  <li>How does it fit the team you are trying to build?</li>
</ul>
<p>A vague brief produces a vague shortlist. A sharp one attracts the right people and makes the decision far easier.</p>
<h2>Write a job advert that filters well</h2>
<p>The goal of an advert is not maximum applications — it is the <em>right</em> applications. Be specific about the role, honest about what it offers, and clear about how to apply. A well-targeted advert saves you hours of sifting.</p>
<h2>Interview with structure</h2>
<blockquote>Unstructured interviews mostly measure how much you like someone. Structured ones measure whether they can do the job.</blockquote>
<ul>
  <li>Ask every candidate the same core questions so you can compare fairly.</li>
  <li>Focus on real examples: "tell me about a time you…" beats "are you a hard worker?"</li>
  <li>Where you can, set a short, realistic task that mirrors the actual work.</li>
  <li>Always check references before making an offer.</li>
</ul>
<h2>Hire for attitude, build the skills</h2>
<p>Especially for early hires, a capable, adaptable person with the right attitude often outperforms a more credentialled one who is a poor fit. Skills can be developed; values and work ethic are far harder to change.</p>
<h2>Close it properly</h2>
<p>When you find the right person, move quickly and make a clear written offer with the key terms. Then start onboarding deliberately — because the best recruitment in the world is wasted if the first two weeks are a mess. Recruit with structure, and you turn your riskiest decisions into your strongest foundations.</p>
`.trim(),
  },

  {
    title: 'Compensation and Benefits: Designing Pay That Retains Good People',
    author: AUTHOR,
    imageQuery: 'money salary financial planning kenya',
    shortDescription:
      'Pay is about more than the headline salary. How small Kenyan businesses can design fair, motivating, sustainable compensation that holds onto talent without breaking the budget.',
    body: `
<p>Many small business owners think about pay only reactively — when a valued employee gets a competing offer, or when someone grumbles. By then you are negotiating from the back foot. A little deliberate thinking about compensation turns pay from a source of anxiety into a tool for attracting and keeping the right people.</p>
<h2>Pay is a system, not a number</h2>
<p>Compensation is the full package an employee receives in exchange for their work. The headline salary matters, but so do the structure around it and the non-cash elements. Thinking in terms of total reward lets a small business compete even when it cannot win on base salary alone.</p>
<h2>Three principles of sound pay</h2>
<h3>1. Be internally fair</h3>
<p>People talk, and nothing corrodes morale faster than a sense that pay is arbitrary or that similar work is rewarded unequally for no clear reason. Have a rationale for what each role pays that you would be comfortable explaining.</p>
<h3>2. Be externally aware</h3>
<p>You do not have to be the highest payer, but you must know roughly where the market sits for your roles. Drift too far below it and you will train good people only to lose them.</p>
<h3>3. Be sustainable</h3>
<p>Promising raises or bonuses you cannot reliably fund is worse than never promising them. Design pay you can honour through a lean month.</p>
<blockquote>People rarely leave purely over money — but they will leave when pay feels unfair. Fairness costs less than you think and matters more than you expect.</blockquote>
<h2>Beyond base salary</h2>
<p>Small businesses can compete with thoughtful extras that often cost less than a salary bump: flexibility, genuine growth and learning opportunities, meaningful recognition, a clear path forward, and a workplace people actually enjoy. For many employees, these tip the balance.</p>
<h2>Get the compliance right</h2>
<p>Whatever you design, make sure the basics are sound: clear gross figures, correct statutory deductions, accurate and on-time payslips, and pay that meets legal minimums. Reliability here is itself a benefit — being paid correctly and on time, every time, builds quiet, deep trust.</p>
<h2>Review it deliberately</h2>
<p>Revisit pay on a predictable cycle rather than only under pressure. A planned annual review — even a modest one — signals that you value people's growth and keeps you ahead of the resignation conversation instead of behind it.</p>
`.trim(),
  },

  {
    title: 'HR Record-Keeping and Compliance: The Files Every Employer Must Keep',
    author: AUTHOR,
    imageQuery: 'organized files documents folders office',
    shortDescription:
      'Good records are boring — until you need them, when they are everything. The essential HR documentation every Kenyan SME should keep, and why disciplined record-keeping is your best protection.',
    body: `
<p>HR record-keeping is the least glamorous part of running a business and one of the most important. The day a dispute, an audit or an inspection arrives, your records are the difference between a quick, confident response and a frightening scramble. The good news: getting this right is mostly discipline, not expertise.</p>
<h2>Why records matter so much</h2>
<p>In any employment dispute, the recurring question is not "what happened?" but "what can you show?" An employer with clean, contemporaneous records is in a vastly stronger position than one relying on memory. Records also keep you compliant, make payroll accurate, and let you run the business on facts rather than guesswork.</p>
<h2>What to keep for every employee</h2>
<ul>
  <li><strong>The signed contract</strong> and any later written variations.</li>
  <li><strong>Personal and statutory details</strong> needed for payroll and remittances.</li>
  <li><strong>Payroll records</strong> — pay, deductions and payslips.</li>
  <li><strong>Leave records</strong> — entitlements taken and balances remaining.</li>
  <li><strong>Performance notes</strong> — check-ins, objectives and reviews.</li>
  <li><strong>Disciplinary and grievance records</strong> — including the steps followed.</li>
  <li><strong>Acknowledgements</strong> — that the employee received the handbook and key policies.</li>
</ul>
<blockquote>You do not keep records because you expect a dispute. You keep them so that if one ever comes, it is no longer frightening.</blockquote>
<h2>Keep it organised, secure and current</h2>
<p>A pile of papers in a drawer is not a record-keeping system. Whether you go digital or physical, each employee should have a complete, clearly organised file that is kept up to date. Employee data is sensitive: store it securely, limit access to those who genuinely need it, and handle personal information responsibly and lawfully.</p>
<h2>Build the habit now</h2>
<p>The best time to set up proper HR records is before you need them — which means today, whatever your size. Create a simple standard file structure, fill the gaps for existing employees, and make completing the file part of every new hire's onboarding. It is unglamorous work that quietly removes a whole category of risk from your business.</p>
`.trim(),
  },
];

module.exports = { articles, AUTHOR };
