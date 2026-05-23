// News intelligence service - rich articles with full content, sources, URLs
// In production: integrate NewsAPI, GDELT, Reuters API

const SOURCES = [
  {name:'Reuters', country:'UK', url:'https://reuters.com', credibility:5, bias:'center'},
  {name:'Associated Press', country:'US', url:'https://apnews.com', credibility:5, bias:'center'},
  {name:'BBC World', country:'UK', url:'https://bbc.com/news', credibility:5, bias:'center-left'},
  {name:'Al Jazeera', country:'Qatar', url:'https://aljazeera.com', credibility:4, bias:'left'},
  {name:'The New York Times', country:'US', url:'https://nytimes.com', credibility:4, bias:'left'},
  {name:'The Guardian', country:'UK', url:'https://theguardian.com', credibility:4, bias:'left'},
  {name:'Defense News', country:'US', url:'https://defensenews.com', credibility:5, bias:'center'},
  {name:'Politico', country:'US', url:'https://politico.com', credibility:4, bias:'center-left'},
  {name:'ISW', country:'US', url:'https://understandingwar.org', credibility:5, bias:'center'},
  {name:'Foreign Policy', country:'US', url:'https://foreignpolicy.com', credibility:4, bias:'center'},
  {name:'ACLED', country:'US', url:'https://acleddata.com', credibility:5, bias:'center'},
  {name:'Bloomberg', country:'US', url:'https://bloomberg.com', credibility:5, bias:'center'},
  {name:'Financial Times', country:'UK', url:'https://ft.com', credibility:5, bias:'center'},
  {name:'Le Monde', country:'France', url:'https://lemonde.fr', credibility:5, bias:'center-left'},
  {name:'Der Spiegel', country:'Germany', url:'https://spiegel.de/international', credibility:5, bias:'center-left'},
  {name:'The Economist', country:'UK', url:'https://economist.com', credibility:5, bias:'center'},
  {name:'Kyiv Independent', country:'Ukraine', url:'https://kyivindependent.com', credibility:4, bias:'pro-Ukraine'},
  {name:'Times of Israel', country:'Israel', url:'https://timesofisrael.com', credibility:4, bias:'pro-Israel'},
];

const ARTICLES = [
  {
    headline:'Russia launches mass drone attack on Ukrainian energy infrastructure',
    region:'Eastern Europe', category:'war', urgency:'high',
    body:`Russian forces launched one of the largest aerial assaults of the war overnight, targeting Ukraine's already-degraded energy infrastructure with a combination of Shahed drones and cruise missiles. According to Ukraine's Air Force, defenses intercepted approximately 70% of the incoming projectiles, but multiple strikes hit substations in Kyiv, Kharkiv, and Odesa regions.

The attack caused widespread power outages affecting an estimated 6 million civilians as temperatures dropped below freezing. President Zelensky condemned the strikes as "deliberate war crimes against civilians" and renewed calls for additional air defense systems from Western allies.

This marks the largest combined missile-drone strike since the campaign against Ukrainian energy began in October 2022. Analysts at the Institute for the Study of War noted Russian forces have stockpiled missiles specifically for the winter campaign, with the goal of degrading Ukrainian morale and industrial capacity.

The strikes coincide with renewed debate in Washington over expanded military aid, including longer-range ATACMS missiles and additional Patriot batteries. NATO Secretary General Rutte called the attacks "barbaric" and pledged accelerated air defense deliveries.`,
    tags:['Ukraine','Russia','Air War','Energy','NATO'],
  },
  {
    headline:'IDF expands operations in northern Gaza',
    region:'Middle East', category:'conflict', urgency:'high',
    body:`Israeli Defense Forces announced expanded ground operations in northern Gaza Strip overnight, with armored columns advancing into Beit Lahia and Jabaliya. The IDF says the operations target Hamas regrouping in areas previously cleared.

Humanitarian organizations report severe shortages of food, water, and medical supplies in the affected areas. The UN Office for the Coordination of Humanitarian Affairs (OCHA) estimates approximately 75,000 civilians remain in the operational zone despite evacuation orders.

The Hamas-run health ministry reports the total Palestinian death toll has exceeded 45,000 since October 7, 2023, with women and children constituting more than half. Israel disputes these figures and says Hamas casualty counts include combatants.

Ceasefire negotiations mediated by Qatar and Egypt remain stalled. The Biden administration has expressed mounting frustration with both sides as the conflict approaches its second year.`,
    tags:['Gaza','Israel','Hamas','Humanitarian','UN'],
  },
  {
    headline:'PLA conducts large-scale exercises near Taiwan Strait',
    region:'Asia Pacific', category:'geopolitics', urgency:'medium',
    body:`China's People's Liberation Army (PLA) launched its largest naval exercises in over a year around Taiwan, deploying approximately 90 vessels including the Shandong aircraft carrier strike group. The exercises encircle Taiwan and include simulated blockade scenarios.

Taiwan's Defense Ministry placed all forces on heightened alert and scrambled F-16V fighters in response. President Lai Ching-te addressed the nation calling China's actions "destabilizing for regional peace and security."

The United States dispatched the USS Theodore Roosevelt carrier strike group to the region. The State Department reiterated American commitment to Taiwan's defense under the Taiwan Relations Act.

Beijing called the exercises a "stern warning" against pro-independence forces, citing recent comments by President Lai as the trigger. China has not ruled out the use of force to achieve unification with Taiwan, which it considers a renegade province.`,
    tags:['China','Taiwan','PLA','US Navy','Asia Pacific'],
  },
  {
    headline:'North Korea tests ICBM with claimed range to US mainland',
    region:'East Asia', category:'nuclear', urgency:'high',
    body:`North Korea conducted a test launch of what it claims is a new Hwasong-19 intercontinental ballistic missile capable of reaching the entire continental United States. The missile flew approximately 1,000 kilometers on a lofted trajectory, reaching an altitude of over 7,000 km.

KCNA state media released images of leader Kim Jong Un personally overseeing the launch alongside his daughter. The report described the missile as a "powerful nuclear strategic weapon" demonstrating the regime's deterrent capability.

The launch drew immediate condemnation from the US, South Korea, and Japan. US Indo-Pacific Command stated the launch "demonstrates the threat" North Korean missile programs pose to the United States, its allies, and the broader international community.

This launch is the latest in an unprecedented series of ICBM tests following the 2022 declaration of irreversible nuclear status. Recent intelligence assessments suggest North Korea may soon conduct a seventh nuclear test, the first since 2017.`,
    tags:['North Korea','ICBM','Nuclear','Hwasong','Kim Jong Un'],
  },
  {
    headline:'Iran uranium enrichment reaches record 84% purity at Fordow',
    region:'Middle East', category:'nuclear', urgency:'critical',
    body:`International Atomic Energy Agency (IAEA) inspectors detected uranium enriched to 83.7% purity at Iran's underground Fordow facility, the highest level ever recorded outside declared weapons programs. Weapons-grade material is considered to be 90% enriched.

The agency's Director General Rafael Grossi stated this represents "a very significant development" that "raises serious questions" about Iran's nuclear intentions. Iran maintains its nuclear program is for peaceful civilian purposes.

The discovery follows Iran's continued violations of the 2015 JCPOA nuclear agreement, which limited enrichment to 3.67%. The deal collapsed after the US withdrew under President Trump in 2018.

Israeli Prime Minister Netanyahu called the development "the most serious nuclear development in decades" and reiterated that Israel reserves the right to take "any action" to prevent Iran from acquiring nuclear weapons. The US National Security Council called for immediate full IAEA access.`,
    tags:['Iran','Nuclear','IAEA','Fordow','Enrichment'],
  },
  {
    headline:'Houthi drone barrage targets Red Sea shipping corridor',
    region:'Middle East', category:'conflict', urgency:'high',
    body:`Yemen's Houthi rebels launched what they described as their "largest combined operation" against commercial shipping in the Red Sea, deploying drones, ballistic missiles, and an unmanned surface vessel against multiple targets.

US Navy destroyers intercepted most projectiles, but two commercial vessels reported minor damage. The UK Maritime Trade Operations (UKMTO) issued a warning to all vessels transiting the Bab el-Mandeb strait.

Houthi spokesman Yahya Saree said the attacks were in solidarity with Palestinians and would continue until Israel ceased operations in Gaza. The Houthis have attacked over 100 commercial vessels since November 2023.

The Red Sea attacks have forced most major shipping companies to reroute around Africa, adding two weeks and significant cost to journeys between Asia and Europe. Global shipping costs have remained elevated, contributing to inflationary pressures.`,
    tags:['Houthis','Yemen','Red Sea','Shipping','Iran'],
  },
  {
    headline:'NATO allies pledge additional air defense for Ukraine',
    region:'Europe', category:'geopolitics', urgency:'medium',
    body:`NATO defense ministers meeting in Brussels agreed to accelerate delivery of additional air defense systems to Ukraine, with Germany pledging two more Patriot batteries and the Netherlands contributing additional NASAMS launchers.

Total committed Western military aid to Ukraine since February 2022 now exceeds $200 billion, with the US contributing approximately $75 billion. Secretary General Mark Rutte called the additional commitments "essential as Russia escalates its campaign against Ukrainian energy infrastructure."

Ukrainian Foreign Minister Andrii Sybiha said while welcome, the new commitments fall short of Ukraine's needs. Kyiv has requested at least 7 additional Patriot batteries to defend critical infrastructure and population centers.

The meeting also discussed long-range strike capabilities. Several European nations indicated openness to providing Ukraine with longer-range missiles to strike Russian military targets, though decisions remain pending.`,
    tags:['NATO','Ukraine','Air Defense','Patriot','Russia'],
  },
  {
    headline:'Sudan RSF seizes strategic town near Khartoum',
    region:'Africa', category:'conflict', urgency:'medium',
    body:`Rapid Support Forces (RSF) fighters captured the town of Sinjah in Sennar state, opening a strategic corridor that threatens government-held territories. The advance displaces an estimated 130,000 civilians who had previously sought refuge there.

The fall of Sinjah is the most significant RSF advance in months and complicates Sudan's already catastrophic humanitarian situation. The International Rescue Committee warned of "imminent famine conditions" across multiple regions.

Sudanese Armed Forces (SAF) commander General Abdel Fattah al-Burhan vowed to retake the town and called for international support against what he described as "UAE-backed mercenaries." The UAE denies allegations of supporting RSF.

The UN World Food Programme warns 25 million Sudanese — half the country — face acute food insecurity. The Famine Review Committee has formally declared famine conditions in parts of Darfur, the first such declaration since 2017.`,
    tags:['Sudan','RSF','SAF','Famine','UAE'],
  },
  {
    headline:'DRC M23 rebels advance toward Goma — civilians fleeing',
    region:'Africa', category:'conflict', urgency:'high',
    body:`M23 rebel forces backed by Rwanda, according to UN reports, captured strategic positions in the hills surrounding Goma, prompting mass civilian displacement. Thousands of refugees flooded the city, which now hosts over 700,000 displaced persons.

Eastern DRC has been wracked by conflict for over 30 years. The M23 group, dormant since 2013, resurged in 2022 and has steadily expanded territory in North Kivu province despite international peacekeeping efforts.

Kenya's President William Ruto called for emergency East African Community meetings. The Southern African Development Community (SADC) mission, which replaced EAC forces, has suffered significant casualties attempting to halt M23 advances.

The conflict has critical implications for global supply chains. DRC's Kivu provinces contain world-class deposits of coltan, cobalt, and other minerals essential for electronics and electric vehicle batteries.`,
    tags:['DRC','M23','Rwanda','Goma','Minerals'],
  },
  {
    headline:'Haiti Kenyan-led force clears gang stronghold in Cité Soleil',
    region:'Caribbean', category:'conflict', urgency:'medium',
    body:`Kenyan-led Multinational Security Support (MSS) mission troops, supported by Haitian National Police, conducted operations in the Cité Soleil neighborhood of Port-au-Prince, dislodging gang fighters from several blocks.

The MSS mission, authorized by UN Security Council Resolution 2699, deployed approximately 400 Kenyan officers to Haiti starting June 2024. Total force strength remains below the planned 2,500 personnel due to funding shortfalls.

Haiti's transitional government, formed after Prime Minister Ariel Henry resigned in April 2024, has slowly reestablished functions but controls only limited territory outside the capital. Gang coalition "Viv Ansanm" remains dominant force in Port-au-Prince.

The US has provided over $300 million in MSS funding but pulled back from direct involvement. France has indicated willingness to join the mission if requested.`,
    tags:['Haiti','MSS','Kenya','Gangs','UN'],
  },
  {
    headline:'Oil prices spike 6% as Houthi attacks disrupt Suez traffic',
    region:'Global', category:'economics', urgency:'medium',
    body:`Global oil prices jumped over 6% in a single session as renewed Houthi attacks force shipping to reroute around Africa, adding two weeks to journeys between Asia and Europe. Brent crude closed at $87.50/barrel.

Maritime traffic through the Suez Canal has fallen approximately 60% from pre-attack levels. The Egyptian government estimates lost canal revenue at over $7 billion annually, severely impacting Egypt's economic crisis.

Shipping rates from Asia to Northern Europe have tripled. Major retailers warn of supply chain disruptions and price increases ahead of the holiday shopping season. Container ship insurance premiums for Red Sea transit have increased tenfold.

The disruptions reinforce vulnerabilities in just-in-time global supply chains. Several major companies, including Tesla and Volvo, have suspended European production lines awaiting components.`,
    tags:['Oil','Suez','Houthi','Supply Chain','Egypt'],
  },
  {
    headline:'Myanmar junta launches airstrike on Sagaing civilian area',
    region:'SE Asia', category:'war', urgency:'high',
    body:`The Myanmar military launched airstrikes on a village in Sagaing region, killing at least 47 civilians including women and children, according to local resistance forces. The strikes targeted areas controlled by anti-junta People\'s Defense Forces (PDF).

Sagaing has been a center of armed resistance since the 2021 military coup. The PDF claims to control over 70% of rural Sagaing, with the junta increasingly relying on airstrikes due to ground force losses.

ASEAN expressed "deep concern" but has taken no substantive action against Myanmar despite the 5-Point Consensus agreed in 2021. China, the junta\'s primary backer, vetoed Security Council action.

Recent battlefield reverses have severely weakened the junta. Operation 1027, launched October 2023, has stripped the regime of significant territory in Shan State, Rakhine, and Sagaing. Defense analysts assess the junta is fighting for survival.`,
    tags:['Myanmar','Junta','Airstrike','PDF','ASEAN'],
  },
  {
    headline:'Iran-backed groups launch coordinated strikes across region',
    region:'Middle East', category:'conflict', urgency:'high',
    body:`Iranian-backed groups across the Middle East launched coordinated strikes targeting US and Israeli interests. Iraqi militias struck US bases in Syria, Houthis launched missiles at Israel, and Hezbollah fired rockets across the Lebanese border.

The strikes follow Israeli operations against Iranian assets in Syria and tensions over Iran\'s nuclear program. Iran\'s "Axis of Resistance" — including Hamas, Hezbollah, Houthis, and Iraqi Shia militias — has been increasingly active.

The US conducted retaliatory strikes against Iran-backed militia positions in Syria and Iraq. The Pentagon emphasized the strikes were "carefully calibrated" to avoid further escalation while signaling continued resolve.

Israeli Prime Minister Netanyahu warned Iran directly, stating "those who attack us will pay a heavy price." Tensions remain at the highest level in years following the assassinations of senior Hamas and Hezbollah figures.`,
    tags:['Iran','Axis of Resistance','Hezbollah','Houthis','US Strikes'],
  },
  {
    headline:'Five Eyes alliance warns of coordinated cyber campaign',
    region:'Global', category:'cyber', urgency:'medium',
    body:`The Five Eyes intelligence alliance (US, UK, Canada, Australia, New Zealand) issued a joint statement warning of coordinated Chinese cyber operations targeting critical infrastructure across allied nations.

The advisory identifies "Volt Typhoon," a Chinese state-sponsored actor, as having pre-positioned access within US infrastructure networks for "potential disruptive or destructive cyber activities." Targeted sectors include energy, water, communications, and transportation.

CISA Director Jen Easterly described the threat as "the most serious cyber challenge we face." Recommendations include immediate patching, mandatory multi-factor authentication, and enhanced network monitoring.

China rejected the allegations as "groundless" and accused the US of being "the largest source of cyber threats." Beijing\'s denial mirrors patterns following previous attribution to Chinese state actors.`,
    tags:['Five Eyes','China','Cyber','Volt Typhoon','Critical Infrastructure'],
  },
  {
    headline:'Russia tests Zircon hypersonic cruise missile in Arctic',
    region:'Europe', category:'military', urgency:'medium',
    body:`Russia conducted a successful test of its 3M22 Zircon hypersonic cruise missile in the Arctic Ocean, launching from the frigate Admiral Gorshkov. The weapon reportedly achieved Mach 9 during the flight.

Russian state media released footage showing the launch and what officials described as a successful hit on a target 400 kilometers away. Defense Minister Belousov stated the test confirms "the missile\'s operational readiness for deployment."

The Zircon represents a class of weapons that travel too fast for current air defense systems to reliably intercept. Western analysts question the true performance of Russian hypersonic weapons but acknowledge their psychological and strategic significance.

The test comes amid escalating tensions over Ukraine and increased Russian military presence in the Arctic. NATO has expanded exercises in the High North in response to growing Russian capabilities.`,
    tags:['Russia','Hypersonic','Zircon','Arctic','NATO'],
  },
  {
    headline:'IAEA reports Iran installed new centrifuges at Natanz facility',
    region:'Middle East', category:'nuclear', urgency:'high',
    body:`International Atomic Energy Agency inspectors confirmed Iran has installed additional advanced IR-6 centrifuges at the Natanz nuclear facility. The new installations significantly increase Iran\'s enrichment capacity.

The IAEA report indicates Iran has more than 14,000 operating centrifuges, with growing portions being advanced models. Combined with elevated enrichment levels at Fordow, this gives Iran the capability to produce enough fissile material for multiple nuclear weapons within weeks.

European signatories of the JCPOA — France, Germany, UK — have triggered the "snapback" mechanism for restoring pre-2015 UN sanctions. The action is largely symbolic but signals diplomatic isolation.

Israeli officials have repeatedly stated Iran approaching weapons-grade capacity represents an existential threat. Defense Minister Israel Katz warned military action remains an option if diplomacy fails.`,
    tags:['Iran','IAEA','Natanz','Centrifuges','JCPOA'],
  },
  {
    headline:'China imposes new restrictions on rare earth exports',
    region:'Asia Pacific', category:'economics', urgency:'medium',
    body:`China\'s Ministry of Commerce announced expanded export controls on rare earth elements and refined metals, citing national security. The new restrictions affect gallium, germanium, antimony, and several other critical minerals essential for advanced electronics and defense.

China processes 60-90% of global supply for many of these materials. Western nations have launched diversification efforts but remain heavily dependent on Chinese supply for years to come.

The Pentagon expressed concern about implications for defense industrial base. Senator Tom Cotton called for "immediate action" to develop alternative supply chains and accelerate strategic stockpiling.

The move is widely interpreted as retaliation for US export controls on advanced semiconductors and chip-making equipment. Bilateral trade relations remain strained with limited diplomatic progress.`,
    tags:['China','Rare Earths','Export Controls','Semiconductors','Supply Chain'],
  },
  {
    headline:'US carrier strike group deploys to Eastern Mediterranean',
    region:'Middle East', category:'military', urgency:'medium',
    body:`The USS Harry S. Truman carrier strike group deployed to the Eastern Mediterranean, joining existing US naval assets in the region. The deployment brings US Navy presence to 5 surface combatants and 1 carrier strike group.

The Pentagon described the deployment as "deterrent presence" amid heightened tensions involving Iran, Houthi attacks on shipping, and the ongoing Israeli-Hamas conflict. Defense Secretary Austin emphasized commitment to regional stability.

The strike group includes guided-missile destroyers Stout, Forrest Sherman, and Bulkeley, along with the cruiser Gettysburg. The naval air wing provides over 70 combat aircraft including F/A-18E/F Super Hornets.

The deployment coincides with British, French, and Italian naval increases in the region. Combined NATO maritime presence represents the most significant peacetime concentration of Western naval power in recent years.`,
    tags:['US Navy','Carrier','Mediterranean','Iran','NATO'],
  },
  {
    headline:'Yemen Houthis claim strike on commercial tanker in Arabian Sea',
    region:'Middle East', category:'conflict', urgency:'high',
    body:`Houthi forces claimed responsibility for a missile strike on a Greek-owned oil tanker in the Arabian Sea, marking expansion beyond their previous Red Sea attack zone. The vessel sustained moderate damage but no casualties.

UK Maritime Trade Operations issued an expanded warning to vessels transiting the Gulf of Aden and now the Arabian Sea. Insurance underwriters announced premium increases for the broader region.

Houthi spokesman Yahya Saree said the attack demonstrates the group\'s ability to "reach Israeli economic interests anywhere." The targeted vessel had previously called at Israeli ports despite no current Israeli affiliation.

The strike expands the geographic scope of Houthi maritime operations and complicates Western military response. The US-led Operation Prosperity Guardian has struggled to fully deter Houthi attacks despite extensive air operations.`,
    tags:['Houthis','Arabian Sea','Tanker','Shipping','US Operations'],
  },
  {
    headline:'Sahel juntas deepen military ties with Russia Africa Corps',
    region:'Africa', category:'geopolitics', urgency:'medium',
    body:`The Alliance of Sahel States (Mali, Burkina Faso, Niger) signed expanded defense agreements with Russia, including additional Africa Corps personnel and equipment deliveries. The agreements formalize Russia\'s replacement of France as primary security partner.

The Africa Corps, successor to the Wagner Group following founder Yevgeny Prigozhin\'s death, now operates in 8+ African nations. Russian forces have conducted counterinsurgency operations across the Sahel with mixed results.

The Sahel juntas withdrew from ECOWAS earlier this year, forming the AES bloc and pursuing closer ties with Russia, Iran, and Turkey. France\'s expulsion from these countries represents major strategic setback in former Francophone Africa.

Civilian casualties have reportedly increased under Russia-backed operations, with multiple investigations alleging human rights violations. The juntas dismiss these reports as Western propaganda.`,
    tags:['Sahel','Russia','Africa Corps','Mali','France'],
  },
  {
    headline:'Philippines scrambles jets as Chinese coast guard enters EEZ',
    region:'Asia Pacific', category:'geopolitics', urgency:'medium',
    body:`Philippines Air Force scrambled fighters in response to Chinese coast guard vessels entering the country\'s Exclusive Economic Zone (EEZ) near Scarborough Shoal. The incident is the most serious in months between the two nations.

Manila lodged formal diplomatic protest while increasing patrols. President Marcos stated the Philippines "will not be intimidated" and reaffirmed commitment to the US-Philippines Mutual Defense Treaty.

The US State Department reaffirmed that South China Sea incidents could trigger treaty obligations. US, Japan, and Australia have increased joint exercises with Philippine forces.

The 2016 Permanent Court of Arbitration ruling under UNCLOS rejected most of China\'s South China Sea claims. Beijing rejects the ruling and continues activities including land reclamation and military deployment on disputed features.`,
    tags:['Philippines','China','South China Sea','Scarborough','US Treaty'],
  },
  {
    headline:'EU announces 12th sanctions package targeting Russian defense',
    region:'Europe', category:'diplomacy', urgency:'low',
    body:`The European Union formally adopted its 12th sanctions package against Russia, targeting additional defense industry entities and individuals. The package adds 90 names to the EU sanctions list.

New measures include restrictions on Russian diamond imports, expanded transit bans on dual-use goods, and tighter enforcement against sanctions evasion through third countries. The package also targets non-Russian entities facilitating sanctions evasion.

EU foreign policy chief Kaja Kallas described the package as "sending a clear message" while acknowledging unanimous member state agreement remains challenging. Hungary continues to oppose certain measures.

Total EU sanctions now cover over 2,200 individuals and entities. Russian elites and entities are subject to comprehensive asset freezes within EU jurisdiction. However, enforcement gaps and evasion remain significant.`,
    tags:['EU','Russia','Sanctions','Defense Industry','Hungary'],
  },
  {
    headline:'South Korea puts military on alert after DPRK provocation',
    region:'East Asia', category:'military', urgency:'medium',
    body:`South Korea raised its military alert level following North Korean trash balloons crossing the DMZ and crashed near the presidential complex in Seoul. The balloons contained refuse and propaganda materials.

President Yoon ordered military to consider "all options" in response. South Korea resumed loudspeaker broadcasts along the DMZ, a measure that previously prompted artillery exchanges from the North.

The recent provocations include over 1,000 trash balloons launched in October and November 2024. North Korea calls them retaliation for South Korean propaganda balloons sent by defector activists.

US Forces Korea increased intelligence collection. The Combined Forces Command maintains over 28,000 US personnel deployed across the peninsula under the bilateral defense treaty signed in 1953.`,
    tags:['South Korea','North Korea','DMZ','Balloons','Yoon'],
  },
  {
    headline:'Israel strikes Iranian-backed militia positions in southern Syria',
    region:'Middle East', category:'conflict', urgency:'high',
    body:`Israeli aircraft conducted strikes against Iranian-backed militia positions and weapons storage sites in southern Syria. The strikes target what Israeli intelligence assesses as weapons transfers to Hezbollah and Iraqi militias.

This represents the latest in a long-running campaign by Israel against Iranian entrenchment in Syria. With the fall of the Assad regime, Israel has dramatically expanded operations, striking former Syrian Arab Army assets to prevent their capture by hostile factions.

Israeli Defense Minister Katz warned "any hostile movement" near Israeli border areas would face immediate response. The IDF has established buffer zones in southern Syria following recent operations.

The new Syrian transitional government, dominated by HTS-aligned factions, has so far avoided direct confrontation with Israel. However, the situation remains highly volatile with multiple armed factions competing for control.`,
    tags:['Israel','Syria','Iran','Hezbollah','HTS'],
  },
];

let articleIdCounter = 1;
let articles = [];

function pickSource() {
  return SOURCES[Math.floor(Math.random()*SOURCES.length)];
}

function createArticle(template, ageMinutes = 0) {
  const source = pickSource();
  return {
    id: `N${articleIdCounter++}`,
    headline: template.headline,
    body: template.body,
    region: template.region,
    category: template.category,
    urgency: template.urgency,
    source: source.name,
    sourceCountry: source.country,
    sourceUrl: source.url,
    credibility: source.credibility,
    bias: source.bias,
    timestamp: new Date(Date.now() - ageMinutes * 60000).toISOString(),
    breaking: Math.random() > 0.88,
    verified: Math.random() > 0.22,
    readTime: Math.ceil((template.body || '').length / 1000) || 2,
    tags: template.tags || [],
    relatedArticleIds: [],
  };
}

// Initialize pool
export function initializeNews(count = 30) {
  articles = [];
  // Start fresh with mix of recent and older articles
  for (let i = 0; i < count; i++) {
    const tpl = ARTICLES[Math.floor(Math.random()*ARTICLES.length)];
    articles.push(createArticle(tpl, i * (5 + Math.random()*15)));
  }
  // Sort by timestamp descending
  articles.sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp));
  return articles;
}

export function addNewArticle() {
  const tpl = ARTICLES[Math.floor(Math.random()*ARTICLES.length)];
  const item = createArticle(tpl, 0);
  articles.unshift(item);
  if (articles.length > 200) articles.pop();
  return item;
}

export function getArticles(limit = 30, category = null, region = null) {
  let filtered = articles;
  if (category) filtered = filtered.filter(a => a.category === category);
  if (region) filtered = filtered.filter(a => a.region === region);
  return filtered.slice(0, limit);
}

export function getArticleById(id) {
  return articles.find(a => a.id === id);
}

export function getSources() {
  return SOURCES;
}

// Initialize on module load
initializeNews(40);
