import streamlit as st
import re
from glue_query_to_llm import answer_question



# ---------------- PAGE CONFIG ----------------
st.set_page_config(
    page_title="CyberCrime Legal Assistant",
    page_icon="⚖️",
    layout="wide"
)

st.title("⚖️ CyberCrime Legal Assistant")
st.caption("AI-powered legal guidance using real cybercrime cases")

# ---------------- SIDEBAR ----------------
with st.sidebar:
    st.header("⚙️ Settings")
    num_results = st.slider(
        "Number of case references",
        min_value=1,
        max_value=5,
        value=3
    )
    st.divider()
    st.info(
        "This system retrieves real cybercrime cases and generates "
        "grounded legal advice using an AI model."
    )


def clean_title(title: str) -> str:
    if not title:
        return "Related Case"
    # Remove "Incident 42", "Case 12", etc.
    title = re.sub(r"(incident|case)\s*\d+\s*-?\s*", "", title, flags=re.IGNORECASE)
    return title.strip()


# ---------------- MAIN UI ----------------
query = st.text_area(
    "Describe the incident:",
    placeholder="e.g., Someone hacked my bank account and transferred money..."
)

if st.button("Analyze & Advise", type="primary"):
    if not query.strip():
        st.warning("Please enter a description of the incident.")
    else:
        with st.spinner("🔍 Analyzing relevant legal cases..."):
            answer, case_summaries = answer_question(query, n_results=num_results)

    st.subheader("🤖 Legal Advice")
    st.markdown(answer)

    if case_summaries:
        st.subheader("📘 Related Case Summaries")
        for idx, case in enumerate(case_summaries):
            title = clean_title(case["title"])
            year = case["year"]

            st.markdown(f"**{title} ({year})**")
            st.write(case["summary"])

            # --- READ MORE TOGGLE ---
            toggle_key = f"read_more_{idx}"

            if toggle_key not in st.session_state:
                st.session_state[toggle_key] = False

            read_more_clicked = st.button(
                "Read more ▼" if not st.session_state[toggle_key] else "Read less ▲",
                key=f"btn_{idx}"
            )

            if read_more_clicked:
                st.session_state[toggle_key] = not st.session_state[toggle_key]

            if st.session_state[toggle_key]:
                st.write(case["full_text"])

            st.markdown("---")



# ---------------- FOOTER ----------------
st.divider()
st.caption(
    "⚠️ Disclaimer: This tool is for educational purposes only and "
    "does not constitute professional legal advice."
)
