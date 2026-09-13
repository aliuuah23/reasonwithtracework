const conceptData = {

    Privacy: {
        interpretationA: "Visual Separation",
        interpretationB: "Controlled Exposure",
        spatialA: "Screening + Offset Orientation",
        spatialB: "Graduated Threshold + Partial Visibility",

        mapPrimary: [
            { label: "Visual Separation", type: "interpretation" },
            { label: "Controlled Exposure", type: "interpretation" },
            { label: "Acoustic Privacy", type: "interpretation" }
        ],

        mapSecondary: [
            "Threshold",
            "Orientation",
            "Enclosure",
            "Screening",
            "Distance",
            "Territory"
        ],

        reading: "Meaning, Interpretation + Spatial Boundaries",

        caseStudy:
            "Learning Spaces Using Layered Privacy Rather Than Total Enclosure",

        conceptNote:
            "Privacy can describe visual, acoustic, territorial or social conditions.",

        conceptDetail:
            "Privacy does not automatically mean complete enclosure. In architectural reasoning, it may refer to controlling visibility, sound, proximity, access or degrees of exposure.",

        readingDetail:
            "This reading direction asks how a broad linguistic term such as Privacy becomes interpreted before it is translated into a spatial decision. It encourages the designer to separate the word from the first solution that comes to mind.",

        caseDetail:
            "A useful precedent would compare learning environments that create privacy through orientation, screening, distance or thresholds rather than simply enclosing users with walls.",

        whyMatters:
            "The same word can produce very different spatial consequences depending on what the designer believes the word requires.",

        related:
            "Threshold · Orientation · Screening · Territory · Exposure"
    },


    Gathering: {
        interpretationA: "Collective Focus",
        interpretationB: "Informal Encounter",
        spatialA: "Centralised Shared Zone",
        spatialB: "Distributed Meeting Edges",

        mapPrimary: [
            { label: "Collective Focus", type: "interpretation" },
            { label: "Informal Encounter", type: "interpretation" },
            { label: "Shared Activity", type: "interpretation" }
        ],

        mapSecondary: [
            "Centrality",
            "Edges",
            "Visibility",
            "Circulation",
            "Overlap",
            "Pause"
        ],

        reading: "Collective Use + Patterns Of Occupation",

        caseStudy:
            "Shared Spaces Organised Around Formal And Informal Gathering",

        conceptNote:
            "Gathering can imply concentration, encounter, visibility or shared activity.",

        conceptDetail:
            "Gathering may describe organised collective activity, casual encounter, observation, temporary congregation or sustained shared occupation.",

        readingDetail:
            "This reading direction examines how patterns of occupation and social interaction can influence spatial organisation without assuming that Gathering always requires one central room.",

        caseDetail:
            "A useful precedent would compare centralised gathering spaces with distributed edges, circulation intersections and informal meeting zones.",

        whyMatters:
            "Different understandings of Gathering can lead to radically different relationships between circulation, programme and shared space.",

        related:
            "Centrality · Encounter · Visibility · Circulation · Pause"
    },


    Flexibility: {
        interpretationA: "Reconfigurable Use",
        interpretationB: "Multiple Simultaneous Uses",
        spatialA: "Movable Elements + Open Field",
        spatialB: "Zoned Overlap + Loose Boundaries",

        mapPrimary: [
            { label: "Reconfigurable Use", type: "interpretation" },
            { label: "Simultaneous Uses", type: "interpretation" },
            { label: "Temporal Change", type: "interpretation" }
        ],

        mapSecondary: [
            "Movable Elements",
            "Open Field",
            "Loose Boundaries",
            "Zoning",
            "Overlap",
            "Adaptability"
        ],

        reading: "Adaptability + Changing Programme",

        caseStudy:
            "Learning Environments Supporting Multiple Modes Of Occupation",

        conceptNote:
            "Flexibility may refer to physical change, temporal change or programme overlap.",

        conceptDetail:
            "Flexibility can describe spaces that physically transform, spaces that tolerate different activities without changing, or spaces whose use changes over time.",

        readingDetail:
            "This reading direction distinguishes physical reconfiguration from broader adaptability, helping the designer identify what kind of change is actually required.",

        caseDetail:
            "A useful precedent would compare movable systems with spaces that remain physically stable but support several programmes through loose organisation.",

        whyMatters:
            "Treating Flexibility as a single idea can cause designers to jump immediately to movable walls or furniture even when another form of adaptability may be more appropriate.",

        related:
            "Adaptability · Overlap · Zoning · Change · Programme"
    },


    Shelter: {
        interpretationA: "Protection From Weather",
        interpretationB: "Psychological Refuge",
        spatialA: "Continuous Overhead Cover",
        spatialB: "Lower Scale + Enclosed Edge",

        mapPrimary: [
            { label: "Weather Protection", type: "interpretation" },
            { label: "Psychological Refuge", type: "interpretation" },
            { label: "Environmental Buffer", type: "interpretation" }
        ],

        mapSecondary: [
            "Canopy",
            "Edge",
            "Shade",
            "Wind",
            "Scale",
            "Enclosure"
        ],

        reading: "Environmental Protection + Perceived Refuge",

        caseStudy:
            "Pavilions Balancing Climatic Shelter With Openness",

        conceptNote:
            "Shelter can operate environmentally, spatially and perceptually.",

        conceptDetail:
            "Shelter may refer to climatic protection, perceived safety, enclosure, shade, refuge or simply a transition away from an exposed condition.",

        readingDetail:
            "This reading direction separates measurable environmental protection from the perceptual experience of feeling sheltered.",

        caseDetail:
            "A useful precedent would compare pavilions that provide climatic protection while maintaining different degrees of visual and spatial openness.",

        whyMatters:
            "A designer may satisfy climatic shelter without producing psychological refuge, or produce refuge without completely enclosing the space.",

        related:
            "Shade · Refuge · Edge · Climate · Enclosure"
    },


    Threshold: {
        interpretationA: "Transition Between Conditions",
        interpretationB: "Negotiated Boundary",
        spatialA: "Layered Entry Sequence",
        spatialB: "Porous Edge + Pause Zone",

        mapPrimary: [
            { label: "Transition", type: "interpretation" },
            { label: "Negotiated Boundary", type: "interpretation" },
            { label: "Pause", type: "interpretation" }
        ],

        mapSecondary: [
            "Porosity",
            "Entry",
            "Boundary",
            "Layering",
            "Territory",
            "Access"
        ],

        reading: "Thresholds, Boundaries + Spatial Transition",

        caseStudy:
            "Projects Using Transitional Zones Between Public And Private Space",

        conceptNote:
            "Thresholds can separate, connect, delay or negotiate spatial territories.",

        conceptDetail:
            "A Threshold is not necessarily a door or line. It may be a spatial interval that changes access, atmosphere, visibility, programme or behavioural expectation.",

        readingDetail:
            "This reading direction examines boundaries as spatial relationships rather than simple divisions between two fixed zones.",

        caseDetail:
            "A useful precedent would compare projects where transition is produced through layering, changes in scale, porosity, programme or occupation.",

        whyMatters:
            "Thinking of Threshold as an interval rather than a line produces a much wider range of spatial consequences.",

        related:
            "Boundary · Access · Porosity · Transition · Territory"
    }

};


let activeConcept = null;
let selectedInterpretation = null;
let selectedSpatialDirection = null;

let discussionComments = [];


/* =========================================================
   NAVIGATION
========================================================= */

function showPage(pageName) {

    document
        .querySelectorAll(".page")
        .forEach(page => {
            page.classList.remove("active");
        });

    document
        .getElementById(pageName)
        .classList
        .add("active");

    if (pageName === "studio") {
        setupDiscussionInput();
        renderDiscussionComments();
    }

    window.scrollTo(0, 0);
}


/* =========================================================
   SEARCH
========================================================= */

function handleSearchKey(event) {

    if (event.key === "Enter") {
        runSearch();
    }
}


function quickSearch(term) {

    document.getElementById("searchInput").value = term;

    runSearch();
}


function searchFromMap(term) {

    document.getElementById("searchInput").value = term;

    runSearch();

    setTimeout(() => {

        document
            .getElementById("results")
            .scrollIntoView({
                behavior: "smooth",
                block: "start"
            });

    }, 50);
}


function capitaliseTerm(term) {

    if (!term) {
        return "";
    }

    return term.charAt(0).toUpperCase() + term.slice(1);
}


function capitaliseSentence(text) {

    const trimmed = text.trim();

    if (!trimmed) {
        return "";
    }

    return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}


function runSearch() {

    let input =
        document
            .getElementById("searchInput")
            .value
            .trim();

    if (!input) {
        input = "Privacy";
    }

    const formattedTerm = capitaliseTerm(input);

    const matchingKey =
        Object.keys(conceptData).find(
            key =>
                key.toLowerCase() ===
                formattedTerm.toLowerCase()
        );

    const term = matchingKey || formattedTerm;

    const data =
        matchingKey
            ? conceptData[matchingKey]
            : createGenericConcept(term);


    document.getElementById("results").innerHTML = `

        <div class="search-summary">
            Results For: ${term}
        </div>


        <div class="result">

            <div class="result-type">
                Concept
            </div>

            <div>

                <div class="result-title">
                    ${term}
                </div>

                <div class="result-note">
                    ${data.conceptNote}
                </div>

            </div>

            <div class="result-action">

                <button
                    class="secondary"
                    onclick="addToReasoning('${escapeForFunction(term)}')"
                >
                    ADD TO REASONING →
                </button>

            </div>

        </div>


        <div class="result">

            <div class="result-type">
                Interpretations
            </div>

            <div>

                <div class="result-title">
                    ${data.interpretationA}
                    /
                    ${data.interpretationB}
                </div>

                <div class="result-note">
                    TRACEWORK surfaces alternatives before one interpretation
                    becomes treated as self-evident.
                </div>

            </div>

            <div class="result-action">
                2 PATHS
            </div>

        </div>


        <div class="result">

            <div class="result-type">
                Reading
            </div>

            <div>

                <div class="result-title">
                    ${data.reading}
                </div>

                <div class="result-note">
                    A possible theoretical grounding for examining the concept.
                </div>

            </div>

            <div class="result-action">
                GROUND →
            </div>

        </div>


        <div class="result">

            <div class="result-type">
                Case Study
            </div>

            <div>

                <div class="result-title">
                    ${data.caseStudy}
                </div>

                <div class="result-note">
                    A precedent category for comparing spatial consequences
                    rather than copying a solution.
                </div>

            </div>

            <div class="result-action">
                VIEW →
            </div>

        </div>


        ${renderConceptMap(term, data)}

    `;
}


/* =========================================================
   CONCEPT MAP
========================================================= */

function renderConceptMap(term, data) {

    const primary = data.mapPrimary || [];
    const secondary = data.mapSecondary || [];

    const primaryHtml =
        primary
            .map(item => `

                <div class="map-node-wrap">

                    <button
                        class="map-node ${item.type}"
                        onclick="searchFromMap('${escapeForFunction(item.label)}')"
                    >
                        ${item.label}
                    </button>

                </div>

            `)
            .join("");


    const secondaryGroups = [

        secondary.slice(0, 2),
        secondary.slice(2, 4),
        secondary.slice(4, 6)

    ];


    const secondaryHtml =
        secondaryGroups
            .map(group => `

                <div class="map-subgroup">

                    ${group
                        .map(item => `

                            <button
                                class="map-small-node"
                                onclick="searchFromMap('${escapeForFunction(item)}')"
                            >
                                ${item}
                            </button>

                        `)
                        .join("")}

                </div>

            `)
            .join("");


    return `

        <div class="map-section">

            <div class="map-heading">

                <div class="map-heading-text">

                    <h3 class="map-title">
                        Concept Map
                    </h3>

                    <p class="map-description">
                        Follow related interpretations and spatial concepts.
                        Each node can reopen the search from a different point.
                    </p>

                </div>


                <div class="map-legend">

                    <div class="legend-item">
                        <span class="legend-dot interpretation"></span>
                        Interpretation
                    </div>

                    <div class="legend-item">
                        <span class="legend-dot spatial"></span>
                        Spatial Direction
                    </div>

                    <div class="legend-item">
                        <span class="legend-dot related"></span>
                        Related Concept
                    </div>

                </div>

            </div>


            <div class="concept-map">

                <div class="map-center-row">

                    <div class="map-center-node">
                        ${term}
                    </div>

                </div>


                <div class="map-branch-row">
                    ${primaryHtml}
                </div>


                <div class="map-subrow">
                    ${secondaryHtml}
                </div>


                <div class="map-hint">
                    Click any node to continue exploring from that concept.
                    The map does not represent a prescribed sequence.
                </div>

            </div>

        </div>

    `;
}


/* =========================================================
   GENERIC CONCEPT
========================================================= */

function createGenericConcept(term) {

    return {

        interpretationA:
            "Spatial Interpretation",

        interpretationB:
            "Alternative Interpretation",

        spatialA:
            "Spatial Strategy A",

        spatialB:
            "Spatial Strategy B",

        mapPrimary: [
            { label: "Interpretation A", type: "interpretation" },
            { label: "Interpretation B", type: "interpretation" },
            { label: "Contextual Reading", type: "interpretation" }
        ],

        mapSecondary: [
            "Threshold",
            "Orientation",
            "Boundary",
            "Programme",
            "Movement",
            "Atmosphere"
        ],

        reading:
            "Related Architectural Reasoning",

        caseStudy:
            "Comparable Spatial Precedent",

        conceptNote:
            `${term} can be unpacked through multiple interpretations, associations and spatial consequences.`,

        conceptDetail:
            `${term} remains open until the designer identifies what the term is being taken to mean within a particular context.`,

        readingDetail:
            "Relevant readings would help clarify the assumptions, interpretations and concepts shaping this reasoning path.",

        caseDetail:
            "Relevant precedents would allow the designer to compare several spatial responses to a similar concern.",

        whyMatters:
            "Making this interpretation explicit allows another designer or tutor to inspect how the term is being translated.",

        related:
            "Threshold · Orientation · Boundary · Programme · Atmosphere"
    };
}


/* =========================================================
   HELPERS
========================================================= */

function escapeForFunction(text) {

    return text
        .replace(/\\/g, "\\\\")
        .replace(/'/g, "\\'");
}


function escapeHtml(text) {

    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


function getConceptData(term) {

    const matchingKey =
        Object.keys(conceptData).find(
            key =>
                key.toLowerCase() ===
                term.toLowerCase()
        );

    if (matchingKey) {
        return conceptData[matchingKey];
    }

    return createGenericConcept(term);
}


/* =========================================================
   ADD TO REASONING
========================================================= */

function addToReasoning(term) {

    activeConcept = capitaliseTerm(term);

    selectedInterpretation = null;
    selectedSpatialDirection = null;

    renderReasonWorkspace();

    showPage("workspace");
}


/* =========================================================
   REASON
========================================================= */

function renderReasonWorkspace() {

    const workspace =
        document.getElementById("reasonWorkspace");

    const status =
        document.getElementById("reasonStatus");


    if (!activeConcept) {

        workspace.innerHTML = `

            <p class="intro">
                No active concept yet.
            </p>

            <button
                class="primary"
                onclick="showPage('explore')"
            >
                GO TO EXPLORE →
            </button>

        `;

        return;
    }


    const data = getConceptData(activeConcept);


    status.innerHTML = `

        Active Concept:
        <strong>${activeConcept}</strong>

        <br>

        Compare interpretations before committing to a spatial direction.

    `;


    workspace.innerHTML = `

        <div class="path-start">

            <div class="node input">
                Linguistic Input
            </div>

            <div class="arrow">
                →
            </div>

            <div class="node active">
                ${activeConcept}
            </div>

        </div>


        <div class="branch-label">
            Possible Interpretations
        </div>


        <div class="branch-grid">


            <div class="branch-card">

                <div class="branch-number">
                    PATH A
                </div>

                <h3>
                    ${data.interpretationA}
                </h3>

                <p>
                    Possible Spatial Consequence:
                    ${data.spatialA}
                </p>

                <button
                    class="secondary"
                    onclick="choosePath(
                        '${escapeForFunction(data.interpretationA)}',
                        '${escapeForFunction(data.spatialA)}'
                    )"
                >
                    CHOOSE PATH A →
                </button>

            </div>


            <div class="branch-card">

                <div class="branch-number">
                    PATH B
                </div>

                <h3>
                    ${data.interpretationB}
                </h3>

                <p>
                    Possible Spatial Consequence:
                    ${data.spatialB}
                </p>

                <button
                    class="secondary"
                    onclick="choosePath(
                        '${escapeForFunction(data.interpretationB)}',
                        '${escapeForFunction(data.spatialB)}'
                    )"
                >
                    CHOOSE PATH B →
                </button>

            </div>

        </div>


        <div id="selectedPathArea"></div>

    `;
}


/* =========================================================
   SELECT PATH
========================================================= */

function choosePath(
    interpretation,
    spatialDirection
) {

    selectedInterpretation = interpretation;
    selectedSpatialDirection = spatialDirection;


    document
        .getElementById("selectedPathArea")
        .innerHTML = `

        <div class="selected-path">

            <div class="selected-path-title">
                Current Reasoning Trace
            </div>

            <div class="selected-chain">

                <div class="node">
                    ${activeConcept}
                </div>

                <div class="arrow">
                    →
                </div>

                <div class="node active">
                    ${selectedInterpretation}
                </div>

                <div class="arrow">
                    →
                </div>

                <div class="node">
                    ${selectedSpatialDirection}
                </div>

            </div>

            <button
                class="primary"
                onclick="groundCurrentPath()"
            >
                GROUND THIS PATH →
            </button>

        </div>

    `;


    updateDiscussion();
}


/* =========================================================
   GROUND
========================================================= */

function groundCurrentPath() {

    const data = getConceptData(activeConcept);


    document
        .getElementById("groundContext")
        .innerHTML = `

        <strong>Current Reasoning Trace:</strong>

        ${activeConcept}
        →
        ${selectedInterpretation}
        →
        ${selectedSpatialDirection}

    `;


    document
        .getElementById("groundCards")
        .innerHTML = `


        <div class="card">

            <small>
                Concept
            </small>

            <h3>
                ${activeConcept}
            </h3>

            <p>
                ${data.conceptNote}
            </p>

            <button
                class="secondary"
                style="margin-top: 22px;"
                onclick="openGroundDetail('concept')"
            >
                OPEN →
            </button>

        </div>


        <div class="card">

            <small>
                Reading
            </small>

            <h3>
                ${data.reading}
            </h3>

            <p>
                Use a theoretical reference to test whether the interpretation
                is adequately grounded rather than assumed.
            </p>

            <button
                class="secondary"
                style="margin-top: 22px;"
                onclick="openGroundDetail('reading')"
            >
                OPEN →
            </button>

        </div>


        <div class="card">

            <small>
                Case Study
            </small>

            <h3>
                ${data.caseStudy}
            </h3>

            <p>
                Compare how related architectural projects produced
                different spatial consequences from similar concerns.
            </p>

            <button
                class="secondary"
                style="margin-top: 22px;"
                onclick="openGroundDetail('case')"
            >
                OPEN →
            </button>

        </div>


        <div
            id="groundDetailPanel"
            style="
                grid-column: 1 / -1;
                margin-top: 6px;
            "
        ></div>


        <div
            style="
                grid-column: 1 / -1;
                margin-top: 8px;
            "
        >

            <button
                class="primary"
                onclick="goToDiscussion()"
            >
                DISCUSS THIS REASONING →
            </button>

        </div>

    `;


    showPage("library");
}


/* =========================================================
   GROUND DETAIL PANEL
========================================================= */

function openGroundDetail(type) {

    const data = getConceptData(activeConcept);

    let label = "";
    let title = "";
    let description = "";
    let lowerLabel = "";
    let lowerContent = "";


    if (type === "concept") {

        label = "Concept / Working Definition";
        title = activeConcept;
        description = data.conceptDetail;
        lowerLabel = "Related Concepts";
        lowerContent = data.related;
    }


    if (type === "reading") {

        label = "Reading / Student View";
        title = data.reading;
        description = data.readingDetail;
        lowerLabel = "Why This Matters";
        lowerContent = data.whyMatters;
    }


    if (type === "case") {

        label = "Case Study / Design Question";
        title = data.caseStudy;
        description = data.caseDetail;
        lowerLabel = "Question To Ask";

        lowerContent =
            `How does this precedent interpret “${activeConcept}”, and how is that interpretation different from your current reasoning path?`;
    }


    document
        .getElementById("groundDetailPanel")
        .innerHTML = `

        <div
            class="card"
            style="
                min-height: 0;
                padding: 28px;
            "
        >

            <small>
                ${label}
            </small>


            <h3
                style="
                    margin-top: 20px;
                    font-size: 20px;
                "
            >
                ${title}
            </h3>


            <p
                style="
                    max-width: 800px;
                    font-size: 12px;
                    line-height: 1.7;
                "
            >
                ${description}
            </p>


            <div
                style="
                    border-top: 1px solid #aaa294;
                    margin-top: 24px;
                    padding-top: 20px;
                "
            >

                <small>
                    ${lowerLabel}
                </small>


                <p
                    style="
                        max-width: 800px;
                        margin-bottom: 0;
                        font-size: 11px;
                    "
                >
                    ${lowerContent}
                </p>

            </div>


            <button
                class="secondary"
                style="margin-top: 24px;"
                onclick="closeGroundDetail()"
            >
                CLOSE
            </button>

        </div>

    `;


    document
        .getElementById("groundDetailPanel")
        .scrollIntoView({
            behavior: "smooth",
            block: "nearest"
        });
}


function closeGroundDetail() {

    document
        .getElementById("groundDetailPanel")
        .innerHTML = "";
}


/* =========================================================
   DISCUSS
========================================================= */

function goToDiscussion() {

    updateDiscussion();

    showPage("studio");
}


function updateDiscussion() {

    if (
        !activeConcept ||
        !selectedInterpretation
    ) {
        setupDiscussionInput();
        return;
    }


    document
        .getElementById("tutorComment")
        .innerHTML = `

        Why does
        “${activeConcept}”
        become
        “${selectedInterpretation}”?

        What alternative interpretation could produce
        a different spatial consequence?

        <div class="actions">

            <button onclick="discussionAction('Defend')">
                DEFEND
            </button>

            <button onclick="discussionAction('Revise')">
                REVISE
            </button>

            <button onclick="discussionAction('Branch')">
                BRANCH
            </button>

        </div>

    `;


    document
        .getElementById("studentComment")
        .innerHTML = `

        ${activeConcept}
        →
        ${selectedInterpretation}
        →
        ${selectedSpatialDirection}

    `;


    setupDiscussionInput();
    renderDiscussionComments();
}


/* =========================================================
   DISCUSSION INPUT
========================================================= */

function setupDiscussionInput() {

    const reviewBox =
        document.querySelector("#studio .review-box");

    if (!reviewBox) {
        return;
    }


    if (
        document.getElementById(
            "discussionExtras"
        )
    ) {
        return;
    }


    reviewBox.insertAdjacentHTML(
        "beforeend",
        `

        <div id="discussionExtras">

            <div
                id="discussionCommentList"
            ></div>


            <div
                style="
                    margin-top: 34px;
                    padding-top: 28px;
                    border-top: 1px solid #777064;
                "
            >

                <div
                    style="
                        margin-bottom: 12px;
                        font-size: 10px;
                        letter-spacing: 1px;
                        text-transform: uppercase;
                    "
                >
                    Add To The Discussion
                </div>


                <div
                    style="
                        max-width: 760px;
                        margin-bottom: 12px;
                        color: #625d55;
                        font-size: 11px;
                        line-height: 1.6;
                    "
                >
                    Question, challenge, defend or propose an alternative
                    interpretation of the reasoning path.
                </div>


                <textarea
                    id="discussionInput"
                    placeholder="Add A Question Or Challenge..."
                    style="
                        width: 100%;
                        max-width: 760px;
                        min-height: 110px;
                        padding: 16px;
                        resize: vertical;
                        border: 1px solid #777064;
                        background: transparent;
                        color: #25231f;
                        font-family: 'Courier New', Courier, monospace;
                        font-size: 12px;
                        line-height: 1.6;
                        outline: none;
                    "
                ></textarea>


                <div>
                    <button
                        class="primary"
                        style="margin-top: 14px;"
                        onclick="addDiscussionComment()"
                    >
                        ADD COMMENT →
                    </button>
                </div>

            </div>

        </div>

        `
    );
}


/* =========================================================
   ADD DISCUSSION COMMENT
========================================================= */

function addDiscussionComment() {

    const input =
        document.getElementById(
            "discussionInput"
        );

    if (!input) {
        return;
    }


    const comment =
        capitaliseSentence(
            input.value
        );


    if (!comment) {
        return;
    }


    discussionComments.push({
        author: "STUDENT / NEW COMMENT",
        text: comment
    });


    input.value = "";


    renderDiscussionComments();
}


/* =========================================================
   RENDER DISCUSSION COMMENTS
========================================================= */

function renderDiscussionComments() {

    const list =
        document.getElementById(
            "discussionCommentList"
        );

    if (!list) {
        return;
    }


    if (
        discussionComments.length === 0
    ) {

        list.innerHTML = "";

        return;
    }


    list.innerHTML =
        discussionComments
            .map(comment => `

                <div class="comment">

                    <div class="comment-name">
                        ${comment.author}
                    </div>

                    <div class="comment-text">
                        ${escapeHtml(comment.text)}
                    </div>

                </div>

            `)
            .join("");
}


/* =========================================================
   DISCUSSION ACTIONS
========================================================= */

function discussionAction(action) {

    const student =
        document.getElementById(
            "studentComment"
        );


    if (action === "Defend") {

        student.innerHTML = `

            <strong>Defend:</strong>

            The selected interpretation is
            “${selectedInterpretation}”.

            The current spatial consequence is
            “${selectedSpatialDirection}”.

            The next step would be to state what evidence or design priority
            supports this connection.

        `;
    }


    if (action === "Revise") {

        student.innerHTML = `

            <strong>Revise:</strong>

            Return to the Reason workspace and select the alternative
            interpretation before committing to the spatial consequence.

            <div class="actions">

                <button onclick="showPage('workspace')">
                    RETURN TO REASON →
                </button>

            </div>

        `;
    }


    if (action === "Branch") {

        student.innerHTML = `

            <strong>Branch:</strong>

            The reasoning trace can retain the current path while opening
            another interpretation for comparison.

            <div class="actions">

                <button onclick="showPage('workspace')">
                    OPEN BRANCHES →
                </button>

            </div>

        `;
    }
}
