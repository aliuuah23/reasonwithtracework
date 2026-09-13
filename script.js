const conceptData = {

    Privacy: {
        interpretationA: "Visual Separation",
        interpretationB: "Controlled Exposure",
        spatialA: "Screening + Offset Orientation",
        spatialB: "Graduated Threshold + Partial Visibility",
        reading: "Meaning, Interpretation + Spatial Boundaries",
        caseStudy: "Learning Spaces Using Layered Privacy Rather Than Total Enclosure",
        conceptNote: "Privacy can describe visual, acoustic, territorial or social conditions."
    },

    Gathering: {
        interpretationA: "Collective Focus",
        interpretationB: "Informal Encounter",
        spatialA: "Centralised Shared Zone",
        spatialB: "Distributed Meeting Edges",
        reading: "Collective Use + Patterns of Occupation",
        caseStudy: "Shared Spaces Organised Around Formal And Informal Gathering",
        conceptNote: "Gathering can imply concentration, encounter, visibility or shared activity."
    },

    Flexibility: {
        interpretationA: "Reconfigurable Use",
        interpretationB: "Multiple Simultaneous Uses",
        spatialA: "Movable Elements + Open Field",
        spatialB: "Zoned Overlap + Loose Boundaries",
        reading: "Adaptability + Changing Programme",
        caseStudy: "Learning Environments Supporting Multiple Modes Of Occupation",
        conceptNote: "Flexibility may refer to physical change, temporal change or programme overlap."
    },

    Shelter: {
        interpretationA: "Protection From Weather",
        interpretationB: "Psychological Refuge",
        spatialA: "Continuous Overhead Cover",
        spatialB: "Lower Scale + Enclosed Edge",
        reading: "Environmental Protection + Perceived Refuge",
        caseStudy: "Pavilions Balancing Climatic Shelter With Openness",
        conceptNote: "Shelter can operate environmentally, spatially and perceptually."
    },

    Threshold: {
        interpretationA: "Transition Between Conditions",
        interpretationB: "Negotiated Boundary",
        spatialA: "Layered Entry Sequence",
        spatialB: "Porous Edge + Pause Zone",
        reading: "Thresholds, Boundaries + Spatial Transition",
        caseStudy: "Projects Using Transitional Zones Between Public And Private Space",
        conceptNote: "Thresholds can separate, connect, delay or negotiate spatial territories."
    }

};


let activeConcept = null;
let selectedInterpretation = null;
let selectedSpatialDirection = null;


/* =========================================================
   NAVIGATION
========================================================= */

function showPage(pageName) {

    const pages = document.querySelectorAll(".page");

    pages.forEach(page => {
        page.classList.remove("active");
    });

    document
        .getElementById(pageName)
        .classList
        .add("active");

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

    document
        .getElementById("searchInput")
        .value = term;

    runSearch();
}


function capitaliseTerm(term) {

    if (!term) {
        return "";
    }

    return term.charAt(0).toUpperCase() + term.slice(1);
}


function runSearch() {

    let input = document
        .getElementById("searchInput")
        .value
        .trim();

    if (!input) {
        input = "Privacy";
    }

    const formattedTerm = capitaliseTerm(input);

    const matchingKey = Object
        .keys(conceptData)
        .find(
            key =>
                key.toLowerCase() ===
                formattedTerm.toLowerCase()
        );

    const term = matchingKey || formattedTerm;

    const data = matchingKey
        ? conceptData[matchingKey]
        : {
            interpretationA: "Spatial Interpretation",
            interpretationB: "Alternative Interpretation",
            spatialA: "Spatial Strategy A",
            spatialB: "Spatial Strategy B",
            reading: "Related Architectural Reasoning",
            caseStudy: "Comparable Spatial Precedent",
            conceptNote: "TRACEWORK would surface multiple possible meanings and spatial consequences for this term."
        };

    document
        .getElementById("results")
        .innerHTML = `

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
                    ${data.interpretationA} / ${data.interpretationB}
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
    `;
}


/* =========================================================
   HELPERS
========================================================= */

function escapeForFunction(text) {

    return text
        .replace(/\\/g, "\\\\")
        .replace(/'/g, "\\'");
}


function getConceptData(term) {

    const matchingKey = Object
        .keys(conceptData)
        .find(
            key =>
                key.toLowerCase() ===
                term.toLowerCase()
        );

    if (matchingKey) {
        return conceptData[matchingKey];
    }

    return {
        interpretationA: "Spatial Interpretation",
        interpretationB: "Alternative Interpretation",
        spatialA: "Spatial Strategy A",
        spatialB: "Spatial Strategy B",
        reading: "Related Architectural Reasoning",
        caseStudy: "Comparable Spatial Precedent",
        conceptNote: "An open concept requiring further interpretation."
    };
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
   REASON WORKSPACE
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

        </div>

        <div style="grid-column: 1 / -1; margin-top: 8px;">

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
   GO TO DISCUSSION
========================================================= */

function goToDiscussion() {

    updateDiscussion();

    showPage("studio");
}


/* =========================================================
   DISCUSSION
========================================================= */

function updateDiscussion() {

    if (
        !activeConcept ||
        !selectedInterpretation
    ) {
        return;
    }

    document
        .getElementById("tutorComment")
        .innerHTML = `

        Why does
        “${activeConcept}”
        become
        “${selectedInterpretation}”?
        What alternative interpretation could produce a different spatial consequence?

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
}


function discussionAction(action) {

    const student =
        document.getElementById("studentComment");

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
