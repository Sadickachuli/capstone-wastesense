CHAPTER TWO: LITERATURE REVIEW 

2.1 Introduction 

This literature review employs a mixed methodology combining systematic academic literature review with comprehensive analysis of existing commercial and prototype systems. For academic sources, I conducted a systematic search (2013–2025) across IEEE Xplore, ScienceDirect, SpringerLink, Google Scholar, and PLOS One using keywords including "Ghana waste reporting app," "ML forecasting waste," "dynamic routing MSW," "IoT waste Ghana," and "data privacy IoT." From over 120 papers initially screened, 40 were deeply reviewed, with 27 selected for thematic synthesis based on relevance to software-based MSWM solutions in developing contexts.

To complement academic findings, I analyzed existing commercial waste management applications and industry implementations both within Ghana and internationally. This included evaluating mobile applications (Zoomlion GH App, TrashSmart), IoT-enabled systems (Borlaman, Bigbelly Smart Bins, Enevo), citizen engagement platforms (Swachhata App, Moje Odpady), and prototype research implementations (BinCam). Commercial system analysis involved reviewing published case studies, technical documentation, user interfaces, and publicly available performance metrics to understand operational capabilities and limitations.

This dual approach provides a comprehensive understanding of both theoretical research contributions and practical implementation challenges in digital waste management systems, enabling identification of gaps between academic proposals and real-world deployments.

2.2 Historical Background of the Research Topic 

Early digital waste management solutions primarily focused on optimizing billing processes and route logistics, laying the groundwork for more advanced technologies in subsequent years. Following the widespread adoption of smartphones post-2015, applications like TrashSmart emerged, enabling residents to schedule waste pickups conveniently (TrashSmart, 2024). Furthermore, recent studies have demonstrated the efficacy of machine learning and GIS techniques in forecasting municipal solid waste generation and composition, enhancing planning and operational efficiency (Frimpong Adu et al., 2025).

2.3 Overview of Existing Systems 

The global landscape of digital waste management solutions reveals a fragmented approach, with systems addressing individual components but lacking comprehensive integration. Within Ghana's context, existing solutions demonstrate varying degrees of sophistication. The Zoomlion GH App provides integrated payment and reporting functionality through mobile interfaces, while TrashSmart offers user-friendly resident scheduling capabilities (Zoomlion Ghana, n.d.; TrashSmart, 2024). Borlaman advances the field by incorporating IoT-equipped bins for desktop-based routing optimization, though it lacks predictive analytics and resident engagement features (Xenya et al., 2023). Academic contributions like Frimpong Adu et al. (2025) deliver highly accurate waste composition forecasts but without integrated routing optimization or real-time resident reporting mechanisms.

International implementations reveal more mature but still fragmented solutions. India's Swachhata App demonstrates effective citizen engagement through real-time issue reporting and municipal dashboards, significantly reducing complaint resolution times (Guest Contributor, 2017). European solutions like Poland's Moje Odpady provide comprehensive resident communication through collection schedules, push notifications, and GIS mapping, though they lack dispatch optimization capabilities (Waste24, n.d.). Advanced IoT implementations in developed markets, such as Bigbelly Smart Bins deployed across USA and global cities, achieve substantial efficiency gains by reducing pick-ups by 80% through fill-level sensors and cloud dashboards, but require significant infrastructure investment (Bigbelly, n.d.). Similarly, Enevo's deployment in Finland and USA demonstrates the potential of IoT sensor analytics combined with automated route optimization, cutting collection trips by 20-40%, though requiring robust network connectivity (Enevo, n.d.).

2.4 Review of Related Work  

2.4.1 Ghanaian Context Solutions

Within Ghana's digital waste management landscape, four primary approaches have emerged. The Zoomlion GH App represents the most commercially mature solution, integrating payment processing with service requests through mobile interfaces, though it lacks predictive analytics and dynamic routing capabilities (Zoomlion Ghana, n.d.). TrashSmart focuses on resident-facing scheduling with high usability standards but provides no forecasting or route optimization functionality (TrashSmart, 2024). Borlaman advances technical sophistication by incorporating IoT-equipped bins for weight logging and desktop-based route planning, yet remains limited to dispatcher-only interfaces without resident engagement or machine learning integration (Xenya et al., 2023). Academic research by Frimpong Adu et al. (2025) demonstrates high-accuracy ML-based composition forecasting but lacks implementation within operational scheduling or routing systems.

2.4.2 International Citizen Engagement Models

Global implementations reveal diverse approaches to citizen participation in waste management systems. India's Swachhata App exemplifies effective real-time citizen reporting through integrated municipal dashboards, achieving measurable reductions in complaint resolution times (Guest Contributor, 2017). The experimental BinCam system demonstrated enhanced ML model accuracy through two-way photo uploads for overflow prediction, though implementation remained at laboratory scale rather than city-wide deployment (Thieme et al., 2011). Poland's Moje Odpady provides comprehensive resident communication through collection schedules, push notifications, and GIS mapping, facilitating improved communication with local waste management services (Waste24, n.d.).

2.4.3 Advanced IoT and Analytics Implementations

Developed market deployments showcase the potential of integrated sensor and analytics systems. Bigbelly Smart Bins, deployed across USA and global cities, utilize fill-level sensors combined with cloud dashboards to optimize collection schedules, achieving 80% reduction in pick-ups through data-driven scheduling (Bigbelly, n.d.). Enevo's implementation in Finland and USA demonstrates automated route optimization through IoT sensor analytics, reducing collection trips by 20-40% while requiring reliable network connectivity infrastructure (Enevo, n.d.). Comprehensive reviews by Sosunova & Porras (2022) identify best practices across sensor deployment, AI integration, routing optimization, and citizen applications within Industry 4.0 frameworks, though noting limited real-world deployment evidence.

2.4.4 Data Privacy & Ethical Concerns

Location Privacy: Geohash encoding allows users to share approximate locations without revealing precise coordinates, thereby enhancing privacy (Niu et al., 2021).
Informed Consent: "We propose a generic framework for information and consent in the IoT which is protective both for data subjects and for data controllers" (Cunche et al., 2018, p. 1)
Data Security: TLS provides end‑to‑end encryption between client and server, ensuring confidentiality and integrity of transported data" (Dierks & Rescorla, 2008).

2.4.5 Technical Feasibility in Low‑Resource Settings

Mobile‐First: SMS-based systems utilizing GSM/GPRS networks can facilitate real-time monitoring of waste bin status, enabling timely alerts to waste management personnel. However, such systems may experience latency issues primarily due to the limitations of GSM modules used for connectivity (Xenya et al., 2020).

2.4.6 Summary of Reviewed Literature 

Analysis of academic literature and commercial implementations reveals a clear progression from basic scheduling applications to sophisticated IoT-enabled systems, yet no existing solution integrates ML forecasting, dynamic route optimization, and facility‐composition modeling within a citizen‐engaged web platform. While Ghana-specific solutions demonstrate increasing sophistication, they remain fragmented across individual functional domains. International implementations, though more technically advanced, require infrastructure investments that may not be feasible in developing contexts.

2.5 Strengths and Weaknesses of Existing Systems 

| System | Context | Strengths | Weaknesses |
|--------|---------|-----------|------------|
| **Ghana-Based Systems** |
| Zoomlion GH App | Ghana | Payment + reporting integrated | No ML forecasting or routing |
| TrashSmart | Ghana | High usability; scheduling | No forecasting; no routing |
| Borlaman | Ghana (IoT bins) | Accurate route planning; weight logs | Desktop only; no resident engagement |
| Frimpong Adu et al. Model | Ghana (academic) | High forecast accuracy | No routing; no reporting portal |
| **International Systems** |
| Swachhata App | India | Real‑time feedback; municipal dashboard | No dynamic routing; no ML forecasting |
| BinCam | Prototype | Improves ML model accuracy | Lab scale; not city‑wide |
| Moje Odpady | Poland | Comprehensive resident communication | No dispatch optimization |
| Bigbelly Smart Bins | USA & global cities | Reduces pick‑ups by 80% | High equipment cost |
| Enevo | Finland/USA | Cuts collection trips by 20–40% | Requires network connectivity |
| IoT‑Enabled SWM Review | Global review | Identifies best practices | Broad scope; few deployments |

Table 2. Strengths and Weaknesses of Existing Systems

2.6 General Comments and Conclusion

Comparative analysis of digital waste management systems across Ghana and international contexts reveals a consistent pattern of functional fragmentation. Ghana-based solutions demonstrate increasing technical sophistication but remain isolated within individual operational domains—payment processing, scheduling, routing, or forecasting—without integrated implementation. International systems, while more technically advanced, either require substantial infrastructure investment unsuitable for developing contexts or remain at experimental scales.

The identified gap encompasses the absence of an end‑to‑end web solution that combines resident reporting, ML forecasting, and real‑time dynamic routing specifically tailored for Ghana's operational context. This gap is particularly significant given the demonstrated efficacy of individual components across various implementations, suggesting that integrated deployment could yield substantial operational improvements while remaining technically feasible within existing infrastructure constraints. 