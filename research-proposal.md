Integrated ML System for Waste Reporting, Recycling Forecasts, and Collection Optimization in Ghana


Abstract
In Ghana, most cities face severe challenges in municipal solid waste management (MSWM). These challenges can include but are not limited to overflowing bins, inefficient waste truck routing, and inadequate recycling forecasts. Ghana adopts a traditional waste collection approach where waste collectors have fixed routes and schedules. This however fails to take into consideration real-time neighborhood demands. This research proposal outlines a react web-based system that allows residents to report when their bins are full, and integrates an ML model for waste generation forecasting. It also includes a dynamic route optimization for waste collection trucks and recycling-site composition modeling that allows recyclers to know the composition of waste that goes to a particular waste dumping site. By partnering with Zoomlion Ghana Limited (a private waste management company in Ghana) for anonymized truck GPS and bin‐emptying logs, the project aims to prototype a responsive dashboard for waste managers, a resident reporting interface, and backend ML pipelines. This project will be piloted in the Ablekuma North sub‐district of Accra, selected for its mixed land use and documented MSWM inefficiencies. There are three key contributions to this project. Firstly, an ethical data-privacy framework for resident location data. Secondly, incorporation of community feedback loops via two way notifications. Lastly, demonstration of technical feasibility in low‐resource settings using mobile‐first architecture. Success metrics encompass overflow reduction, route‐efficiency gains, fuel savings, and forecasting accuracy. This work advances Ghana’s SDG 11 (Sustainable Cities) by enabling data‐driven, citizen‐engaged waste services.
CHAPTER ONE: INTRODUCTION 

 1.1 Introduction and Background
Municipal solid waste (MSW) management presents significant and escalating challenges for rapidly urbanizing cities in developing countries. Infrastructure and budget alone often cannot keep up with fast growing waste generation (Hoornweg & Bhada‑Tata, 2012). In Ghana alone, MSW per capita averages 0.51 kg/day which exceeds the Sub-Saharan African average of 0.46/day, with Accra alone producing more than 3,000 tonnes every day yet only about 60 percent is formally collected (World Bank, 2018). The uncollected remainder only piles up on streets, blocks drainage systems, and fuels flooding and outbreaks of vector‑borne diseases (Odonkor & Sallar, 2021; Ntajal et al., 2022). Greater Accra is home to an estimated 5 million residents, comprising both formal neighborhoods which are often served by regular waste collection and informal settlements, where service gaps lead many to depend on informal waste pickers or resort to illegal dumping (Kaza et al., 2018; Oteng-Ababio, 2014). Traditional waste collection systems in the city commonly rely on fixed-route schedules that do not adjust to real-time demand fluctuations, resulting in inefficiencies such as missed pickups and overflowing bins (Sulemana et al., 2019; Oteng-Ababio, 2017). Against this backdrop, digital tools and data‑driven methods are emerging as cost‑effective ways to stretch limited resources. For example, TrashSmart’s mobile app lets users request on‑demand pickups, cutting missed collections by 25 percent and achieving an 80 percent satisfaction rate among pilot users (TrashSmart, 2025). Similarly, machine learning (ML) models in Cape Coast have predicted waste generation with R² = 0.99 accuracy, demonstrating their potential to power adaptive routing and resource allocation (Frimpong Adu et al., 2025). However, Ghana lacks a unified platform that weaves together real‑time resident reporting, ML‑based waste forecasting, and dynamic route optimization. Without such integration, operators like Zoomlion Ghana Ltd. cannot proactively address neighborhood‑level overflow risks or tailor collection routes to shifting demand. At the same time, variability in waste composition complicates recycling and disposal planning (Abdulai et al., 2025). Bringing these elements together where resident taps for overflow alerts, high‑resolution forecasting, and responsive routing promises a more efficient, resilient, and citizen‑focused MSWM system.

 1.2 Problem statement
Accra’s municipal solid waste management faces several critical limitations. First, fixed collection schedules and static routing plans frequently fail to accommodate temporal and spatial variations in waste generation (Sulemana et al., 2019). GIS‑based route optimization has demonstrated the ability to reduce travel distances by up to 10.9 percent and travel times by up to 3.7 percent, significantly enhancing operational efficiency (Awuah et al., 2021). Second, the absence of accurate, timely waste composition data hampers recycling facility planning and capacity management across African cities (Chirambo, 2021). Third, community engagement remains minimal due to the lack of robust two‑way communication channels that allow residents to report service issues or receive updates. Digital platforms can address this gap by enabling real‑time reporting and feedback, thereby improving service responsiveness and fostering greater public involvement (Sustainability Directory, 2025). Finally, while apps such as TrashSmart’s scheduling tool (TrashSmart, n.d.) and BinCam’s photo‑reporting system (Thieme et al., 2011) empower resident‑driven pickup requests and on‑demand reporting, neither incorporates machine‑learning forecasts, dynamic route optimization, nor direct integration with facility logs which leaves substantial inefficiencies in both collection routing and recycling planning unaddressed.
1.3 Project’s main objective

What is the overall aim of your project?
The overall aim of my project is to develop an integrated web‐based ML system that leverages resident “Bin Full” reports, truck logs from Zoomlion, and facility composition data to optimize waste collection routes, forecast neighborhood‐level generation and composition, and provide dashboards for residents and waste managers including recyclers.
1.3.1 List of the specific objectives

O1: Privacy‑Preserving Reporting Interface
By Week 4, design, implement, and deploy a mobile “Bin Full” reporting interface (Android & iOS) that uses on‑device hashing and geospatial aggregation to grid‑cells (~1 km²) to anonymize location. Success: ≥ 90 percent of test submissions (n = 50 pilot users) complete without revealing exact coordinates.
O2: ML Forecasting Models
By Week 6, build and validate machine‑learning models to 
(a) forecast bin‑overflow events 24 hours in advance.
(b) predict daily waste composition per zone. 
Success: Achieve mean absolute error ≤ 10 percent on a 2‑week hold‑out set (n = 200 historical tap records per zone).


O3: Dynamic Route Optimization
By Week 7, develop a Google OR‑Tools CP‑SAT routing module that ingests real‑time “Bin Full” taps and ML forecasts to generate daily collection routes. 
Success: Demonstrate ≥ 15 percent reduction in total route distance and ≥ 10 percent reduction in travel time compared to the static baseline.
O4: GPS & Facility Log Integration
By Week 9, integrate GPS traces from at least 10 collection trucks and daily facility processing logs into the forecasting and routing pipeline. 
Success: Improve forecast accuracy by ≥ 5 percent and achieve ≥ 90 percent route adherence in pilot simulations.
O5: Ablekuma North Pilot Evaluation
Over a 4‑week pilot in Ablekuma North (Weeks 10–14), deploy the end‑to‑end system with 200 taps and 10 trucks. 
Success metrics: 20 percent reduction in overflow incidents, 15 percent improvement in route efficiency, and 10 percent fuel savings relative to the previous quarter’s baseline.
1.4 Research questions
How can resident‐reported “Bin Full” events drive ML forecasting of MSW generation?


What dynamic routing algorithms best leverage resident reports and forecasts to reduce distance and fuel?


How does integrating facility composition logs enhance recycling forecasts?


What is the impact on overflow rates, route efficiency, and fuel consumption during the pilot?


How can data privacy and ethical concerns be addressed when using location‐based reports?

1.5 Project scope


Duration:
Weeks 1–4: Rapid prototyping and development of the web application and backend services.


Week 5: Pilot data collection with Zoomlion’s logs and resident “Bin Full” reports.


Weeks 6–8: ML model training, route‑optimization integration, and system evaluation.
Location:
Ablekuma North Sub‑District, Accra: A mixed‑use neighborhood served by approximately 200 public waste bins and five Zoomlion collection trucks.
Stakeholders & Users:
Residents submitting “Bin Full” reports via the web app


Zoomlion dispatchers monitoring real‑time overflows and optimized routes


Truck drivers following dynamic, data‑driven routes


Recycling facility managers using composition forecasts to plan processing


Data Inputs:


Anonymized GPS traces from collection vehicles


Bin‑emptying records (timestamps, locations, volumes)


Facility composition logs (daily weights by material type)


Environmental data (e.g., rainfall) to improve forecast accuracy



1.6 Significance and Justification

Successful implementation of this project will reduce bin overflows, at the same time improving public health and urban sanitation. It will also cut truck route distances, saving fuel costs and lowering CO₂ emissions.
Recycling forecasts will be enhanced to ± 10% composition accuracy, enabling optimized facility throughput and reduced waste processing backlogs. This accuracy supports better planning and resource allocation at recycling centers.
The project will demonstrate a citizen‐engaged, privacy‐preserving, ML‐driven MSWM model that can scale across Ghana. By integrating real‐time feedback and secure data handling, it establishes a replicable framework for other municipalities.




1.7 Research Budget


Table 1: Budget table
Item
Cost (Rwf)
Notes
Web hosting & cloud compute
~100k
1 month Azure credits
Data ingestion & storage (Zoomlion)
~50k
Secure DB hosting
Miscellaneous (domain, SSL)
50k
Security certificates
Total
200k






1.8 Research Timeline https://docs.google.com/spreadsheets/d/1Ce0g2ardDDVh4HXBPCYXOJ0iQknx5fIsslcyMiZYA0o/edit?usp=sharing 
CHAPTER TWO: LITERATURE REVIEW 


2.1 Introduction 

I conducted a systematic search (2013–2025) across IEEE Xplore, ScienceDirect, SpringerLink, Google Scholar, and PLOS One for software‐based MSWM solutions in developing contexts. Keywords included “Ghana waste reporting app,” “ML forecasting waste,” “dynamic routing MSW,” “IoT waste Ghana,” and “data privacy IoT.” Over 120 papers screened, 40 deeply reviewed, 27 selected for thematic synthesis.
2.2 Historical Background of the Research Topic 
Early digital waste management solutions primarily focused on optimizing billing processes and route logistics, laying the groundwork for more advanced technologies in subsequent years. Following the widespread adoption of smartphones post-2015, applications like TrashSmart emerged, enabling residents to schedule waste pickups conveniently (TrashSmart, 2024). Furthermore, recent studies have demonstrated the efficacy of machine learning and GIS techniques in forecasting municipal solid waste generation and composition, enhancing planning and operational efficiency (Frimpong Adu et al., 2025).
2.3 Overview of Existing System 

Existing digital solutions in Ghana’s MSWM landscape address individual components but fall short of end‑to‑end integration. For example, TrashSmart (2024) offers a user‑friendly resident scheduling interface but lacks any machine‑learning forecasting or dynamic route adjustment. Borlaman (Xenya et al., 2023) enhances routing for desktop dispatchers by leveraging IoT‑equipped bins, yet it omits predictive analytics and does not provide a resident‑facing reporting portal. Similarly, Frimpong Adu et al. (2025) deliver highly accurate waste composition forecasts but without incorporated routing optimization or a mechanism for residents to submit real‑time overflow alerts.

2.4 Review of Related Work  
2.4.1 Data Privacy & Ethical Concerns
Location Privacy: Geohash encoding allows users to share approximate locations without revealing precise coordinates, thereby enhancing privacy (Niu et al., 2021).
Informed Consent: “We propose a generic framework for information and consent in the IoT which is protective both for data subjects and for data controllers” (Cunche et al., 2018, p. 1)
Data Security: TLS provides end‑to‑end encryption between client and server, ensuring confidentiality and integrity of transported data” (Dierks & Rescorla, 2008).
2.4.2 Community Feedback Loops
Swachhata App (India): Real‐time citizen reports reduced complaint resolution time (Guest Contributor, 2017).


BinCam: Two‐way photo uploads improved model accuracy for overflow prediction. (Thieme et al., 2011).


Moje Odpady (Poland): This app in Poland offers residents functionalities like waste collection schedules, push notifications, and reporting tools, facilitating better communication with local waste management services (Waste24, n.d.).

2.4.3 Technical Feasibility in Low‑Resource Settings
Mobile‐First: SMS-based systems utilizing GSM/GPRS networks can facilitate real-time monitoring of waste bin status, enabling timely alerts to waste management personnel. However, such systems may experience latency issues primarily due to the limitations of GSM modules used for connectivity (Xenya et al., 2020).
2.4.4 Summary of Reviewed Literature 
While prior work covers scheduling apps (TrashSmart), IoT sensor platforms, and centralized dashboards, none integrates ML forecasting, dynamic route optimization, and facility‐composition modeling within a citizen‐engaged web platform tailored for Ghana. Our proposal addresses these gaps.
2.5 Strengths and Weakness of the Existing System(s) 
System
Strengths
Weaknesses
TrashSmart
High usability; scheduling
No forecasting; no route optimization
Borlaman
Route planning; weight logs
Desktop only; no resident engagement
Frimpong Adu et al.
Composition forecasting
No scheduling; no routing

Table 2. Strengths and Weakness of the Existing System(s)
2.6 General comment and Conclusion
A gap exists for an end‑to‑end web solution combining resident reporting, ML forecasting, and real‑time dynamic routing in Ghana.
CHAPTER THREE: SYSTEM ANALYSIS AND DESIGN 
                         
3.1 Introduction 
I adopt an agile “Integrate–Build–Validate” cycle to deliver the web prototype.
3.2 Research Design (including the development model used)
3.2.1 Overall Methodological Approach
This study adopts a mixed‑methods design. The quantitative strand centers on real‑time “Bin Full” tap logs, truck GPS and facility throughput data, and machine‑learning forecasts, producing measurable KPIs (overflow incidents, route distance/time, fuel use). The qualitative strand gathers resident and driver feedback via short surveys and informal interviews during the pilot, exploring user experience, trust, and barriers to adoption. Together, these methods allow both rigorous performance evaluation and nuanced understanding of human factors.
3.2.2 Development Model: Solo Agile (Scrum‑Inspired)
Development Model: Solo Agile (Scrum‑inspired) with 1‑week sprints and continuous integration.
I will act as the sole developer, product owner, and scrum master, running a rapid, iterative cycle of planning, execution, review, and retrospective each week. This approach ensures regular deliverables, tight feedback loops, and the ability to adapt to data availability or stakeholder input.
Sprint
Goal & Deliverable
1
Setup & Data Request
– Formal NDA and data request to Zoomlion for:
• Resident “Bin Full” tap logs
• Truck GPS & route logs
• Facility processing logs
• Static metadata (zones, schedules)
– If logs not delivered by May 30, generate synthetic pilot dataset mirroring expected schema.
2
Data Ingestion & Schema
– Ingest and validate Zoomlion data (or synthetic).
– Define unified data schema and build ETL pipelines.
3–4
ML Forecasting APIs
– Sprint 3: Prototype overflow‑prediction model (24 h ahead), validate on pilot data.
– Sprint 4: Extend to daily composition model; package as REST endpoints.
5–6
Routing Engine & API
– Sprint 5: Integrate Google OR‑Tools CP‑SAT solver into backend, ingest real‑time taps & forecasts.
– Sprint 6: Expose routing results via REST, benchmark vs. static baseline.
7
Dashboard Frontend (MVP)
– Scaffold React app, connect to forecasting & routing APIs.
– Display: zone map, forecast graphs, and route visualizer.
8
Full Feature Dashboard
– Add “Bin Full” tap interface, privacy settings.
– Implement real‑time updates, user authentication.
9–10
Pilot Deployment & Monitoring
– Deploy to Ablekuma North: 200 taps + 10 trucks.
– Collect KPI data on overflow rates, route adherence, and fuel use.
11
Evaluation & Retrospective
– Analyze pilot KPIs vs. baseline.
– Document lessons learned, refine objectives for scale‑up.

Table 3: Research Design
Key Agile Practices:
Weekly Sprint Planning & Review: I will define sprint goals every Monday and demo completed work to stakeholders (Zoomlion liaison) every Friday.


Backlog & Prioritization: Feature requests and bug fixes will be maintained in a simple Trello board, prioritized by impact on pilot KPIs.


Continuous Integration: All code committed to GitHub will trigger automated tests and linting to ensure stability.


Retrospectives: After each sprint, I’ll capture what went well and what to improve, keeping the process lean and adaptive.


By using this Solo Agile model, I ensure transparency, rapid progress, and the ability to pivot if data or requirements change—all critical for a one‑person project under tight timelines.
3.2.3 Data Requirements & Ethics

Data Stream
Fields
Privacy Safeguards
Resident Reports
user_id, timestamp, zone_id
hashed IDs, opt‐in consent
Truck & Bin Logs
truck_id, timestamp, zone_id, volume, event_type
TLS encryption, role‐based access
Facility Composition Logs
facility_id, timestamp, truck_id, total & breakdown weights
de‐identified facility IDs
Static Metadata
bin/zone ↔ geo, truck capacities, facility types
public metadata

Table 4. Data requirements
3.3 Functional and Non-functional Requirements 


ID
Requirement
F1
Resident Reporting: Residents submit “Bin Full” reports (one‑tap) via web app and receive on‑screen confirmation.
F2
Manager Dashboard: Dispatchers view real‑time heatmap of reported overflows and upcoming forecasted events.
F3
Forecast Visualizations: Display 7‑day neighborhood MSW volume and composition forecasts.
F4
Route Optimization: Generate dynamic truck routes within the web app, updated hourly based on new reports & forecasts.
F5
Historical Analytics: Provide charts/tables of past pickup performance, forecast accuracy, and fuel‐savings estimates.

Table 5. Functional Requirements
Non‑Functional
N1: Privacy: user_id anonymized; TLS 1.2 encryption.


N2: Performance: API responses < 200 ms.


N3: Reliability: 99 percent uptime.3.4 System Architecture Diagrams
Figure 3.4.1: System Architecture
ML Pipeline (Figure 2): Data Ingestion → Cleaning → Feature Eng. (rain, density) → Random Forest → Forecast Service.
3.5 UML Diagrams
ERD: Tables for Users, Reports, EmptyLogs, FacilityLogs, Zones, Trucks.
Class Diagram: Entities for UserReport, Forecast, RoutePlan, Zone, Truck.
Use Case: Reporting, Scheduling, Forecasting, Viewing.

Figure 3.5.1: UML diagrams(ERD, Class, and Use case diagrams)
3.6 Development Tools
Backend: Python 3.10, Flask, Scikit‑Learn
Frontend: React.js, Mapbox GL JS
Database: PostgreSQL + PostGIS
DevOps: Docker, Azure/AWS ECS, GitHub Actions

3.6.1 ML Models & Optimization Algorithms
Overflow Forecasting: LSTM recurrent network trained on past bin‐reports & environmental features (rainfall, holidays) (Frimpong Adu et al., 2025).


Composition Prediction: Among the models evaluated, Random Forest demonstrated superior performance, achieving an R‑squared score of 0.9915 and the lowest error metrics (MAE: 0.0422, MSE: 0.0077) (Frimpong Adu et al., 2025, p. 12).


Dynamic Routing: Google OR-Tools' routing solver effectively addresses dynamic routing problems by minimizing travel distances while adhering to specified time-window constraints. This capability is particularly useful in optimizing delivery schedules and logistics operations. (Google Developers, n.d.)
3.7 Risk Management

Risk
Mitigation
Data delay from Zoomlion
Use synthetic pilot dataset
Resident app non‐adoption
Incentives (e.g., gamification)
ML model underfitting
Feature engineering, ensemble models
Infrastructure downtime
Multi‐region cloud deployment

Table 6. Risk Management
References (APA Format)

Abdulai, I., & Fuseini, M. N. (2025). Making cities clean with collaborative governance of solid waste infrastructure in Ghana. Cleaner Waste Systems, 8, 100150. https://doi.org/10.1016/j.clwas.2024.100150 
Awuah, E. B., Rockson, M. A. D., & Andam‑Akorful, S. A. (2021). Rational approach to optimization of solid waste collection routing using GIS: A case study of Adentan West residential area of Accra. Preprints. https://www.preprints.org/manuscript/202104.0012 
Cunche, M., Le Métayer, D., & Morel, V. (2018). A Generic Information and Consent Framework for the IoT. arXiv. https://arxiv.org/abs/1812.06773
Chirambo, D. (2021). Climate Change Adaptation: Opportunities for Increased Material Recycling Facilities in African Cities. In W. Leal Filho, A. M. Azul, L. Brandli, P. G. Özuyar, & T. Wall (Eds.), Climate Change Management (pp. 857–870). Springer. https://doi.org/10.1007/978-3-030-45106-6_61 
Thieme, A., Weeden, J., Kraemer, N., Lawson, S., & Olivier, P. (2011). BinCam: Waste logging for behavioral change. In Personal Informatics & HCI: Design, Theory, & Social Implications at CHI 2011 (May 7). Vancouver, BC, Canada. https://designandwellbeing.com/papers/bincam.pdf? 

Dierks, T., & Rescorla, E. (2008). The Transport Layer Security (TLS) Protocol Version 1.2 (RFC 5246). IETF. https://tools.ietf.org/html/rfc5246 
Frimpong–Adu, T., Mensah, L. D., Rockson, M. A. D., & Kemausuor, F. (2025). Forecasting municipal solid waste generation using ML and GIS: Cape Coast, Ghana. Cleaner Waste Systems, 10, 100218. https://doi.org/10.1016/j.clwas.2025.100218 
Google Developers. (n.d.). Vehicle Routing. Retrieved from https://developers.google.com/optimization/routing 
Guest Contributor. (2017). How the new Swachhata app helped a citizen get rid of a garbage dump in his area in just a few hours. The Better India. https://thebetterindia.com/96351/swachhtaa-app-ministry-of-urban-development/
Hoornweg, D., & Bhada‐Tata, P. (2012). What a waste: A global review of solid waste management. World Bank.
Kaza, S., Yao, L., Bhada-Tata, P., & Van Woerden, F. (2018). What a waste 2.0: A global snapshot of solid waste management to 2050 (Urban Development Series). World Bank. https://doi.org/10.1596/978-1-4648-1329-0 
Niu, B., Zhang, Y., Li, X., & Li, Y. (2021). Verifiable location-encrypted spatial aggregation computing for mobile crowd sensing. Security and Communication Networks, 2021, 1–12. https://doi.org/10.1155/2021/6654539
Ntajal, J., Höllermann, B., Falkenberg, T., Kistemann, T., & Evers, M. (2022). Water and health nexus—Land use dynamics, flooding, and water-borne diseases in the Odaw River Basin, Ghana. Water, 14(3), 461. https://doi.org/10.3390/w14030461
Odonkor, S. T., & Sallar, A. M. (2021). Correlates of household waste management in Ghana: implications for public health. Heliyon, 7(11), e08227. https://doi.org/10.1016/j.heliyon.2021.e08227
Oteng-Ababio, M. (2014). The role of the informal sector in solid waste management in the GAMA, Ghana: Challenges and opportunities. Tidsskrift for Afrikastudier, 21(1), 39–59.
Oteng-Ababio, M. (2017). Unpacking the impacts of poor solid waste management on health and the environment: The case of Accra, Ghana. Urban Africa Risk Knowledge (Urban ARK) Working Paper Series.
Sulemana, A., Donkor, E., Forkuo, E. K., & Oduro-Kwarteng, S. (2019). Effect of optimal routing on travel distance, travel time and fuel consumption of waste collection trucks. Management of Environmental Quality: An International Journal, 30(4), 803–832. https://doi.org/10.1108/MEQ-07-2018-0134 
Sustainability Directory. (2025). How Does Technology Impact Community Engagement In Waste Management? Retrieved from https://sustainability-directory.com/question/how-does-technology-impact-community-engagement-in-waste-management/ 
TrashSmart. (n.d.). Retrieved May 2025, from https://trashsmart.org
Waste24. (n.d.). Moje Odpady – Harmonogram wywozu odpadów. Retrieved from https://moje-odpady.pl/
World Bank. (2018). What a waste 2.0: A global snapshot of solid waste management to 2050. Urban Development Series.
Xenya, M. C., D’souza, E., Woelorm, K.-O. D., Adjei‐Laryea, R. N., & Baah‐Nyarkoh, E. (2020). Proposed IoT based smart waste bin management system with an optimized route: A case study of Ghana. IEEE ISCAIE 2019. https://www.researchgate.net/publication/341076146_A_Proposed_IoT_Based_Smart_Waste_Bin_Management_System_with_An_Optimized_Route_A_Case_Study_of_Ghana 

