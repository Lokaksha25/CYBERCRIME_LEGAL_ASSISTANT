import os
import re
from groq import Groq


# Initialize Groq client
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
client = Groq(api_key=GROQ_API_KEY) if GROQ_API_KEY else None

def clean_title(title: str) -> str:
    if not title:
        return "Related Case"
    # Remove "Incident 42", "Case 12", etc.
    title = re.sub(r"(incident|case)\s*\d+\s*-?\s*", "", title, flags=re.IGNORECASE)
    return title.strip()

def summarize_document(doc: str, max_chars: int = 450) -> str:
    if len(doc) <= max_chars:
        return doc.strip()

    cut = doc[:max_chars]
    last_period = cut.rfind(".")
    return cut[: last_period + 1] if last_period != -1 else cut + "..."


def clean_document_text(doc: str) -> str:
    if not doc:
        return ""

    # Remove leading "Incident: XYZ Incident 42 - City"
    doc = re.sub(
        r"Incident:\s*.*?(?:\n|$)",
        "",
        doc,
        flags=re.IGNORECASE
    )

    # Remove repeated "Category:" line if present
    doc = re.sub(
        r"Category:\s*.*?(?:\n|$)",
        "",
        doc,
        flags=re.IGNORECASE
    )

    return doc.strip()


def generate_answer(question, retrieved_docs):
    if not client:
        return "⚠️ GROQ_API_KEY not set.", []

    context = ""
    case_summaries = []

    for i, item in enumerate(retrieved_docs, 1):
        meta = item["metadata"]
        raw_doc = item["document"]
        clean_doc = clean_document_text(raw_doc)

        title = clean_title(meta.get("title", "Related Case"))

        case_summaries.append({
            "title": title,
            "year": meta.get("year", "N/A"),
            "summary": summarize_document(clean_doc),
            "full_text": clean_doc
        })

        context += f"""
Title: {title}
Laws Involved: {meta.get('laws', 'N/A')}
Description:
{clean_doc}
"""


    system_prompt = """
You are a domain-restricted Cybercrime Legal Assistant.

You are trained ONLY on retrieved Indian cybercrime case records supplied to you at runtime.

CRITICAL RULES (MANDATORY):
- Use ONLY the information explicitly present in the retrieved case records.
- Base all reasoning, explanations, and guidance on patterns, actions, and outcomes observed in those cases.
- Do NOT use general legal knowledge, textbook explanations, or assumptions.
- Do NOT invent laws, legal sections, procedures, authorities, or outcomes.
- If the retrieved cases are insufficient to fully answer the question, clearly state the limitation instead of guessing.

RESPONSE OBJECTIVE:
Your primary goal is to:
1. Help the user understand their situation by comparing it to similar real cases.
2. Reassure the user that the response is grounded in verified case records.
3. Clearly guide the user on what practical next steps were taken or recommended in similar cases.

STYLE & TONE:
- Calm, professional, and reassuring.
- Sound like a legal support system backed by real case files.
- Avoid AI-like phrases such as "generally", "typically", or "it is advised".
- Speak in terms of "In similar cases, authorities..." or "Case records show that victims..."

MANDATORY OUTPUT STRUCTURE:


1. Case Overview  
   - Briefly summarize the user’s situation in neutral language.
   - Identify what type of cybercrime it most closely resembles based on the retrieved cases.

2. What Similar Cases Show  
   - Explain how comparable cases unfolded according to the retrieved records.
   - Briefly mention how authorities or institutions responded, if available.

3. Next Steps Observed in Case Records (PRIMARY FOCUS)  
   - This section must be the most detailed part of the response.
   - Clearly list the concrete actions victims took or were directed to take in similar cases.
   - Focus on practical, time-sensitive steps such as reporting, evidence preservation, account protection, and follow-up actions.
   - Present steps in a clear, structured manner.

4. Data Source Note (Keep Short)  
   - In 1–2 sentences, state that the guidance is derived exclusively from retrieved Indian cybercrime case records.
   - Do not repeat disclaimers or expand unnecessarily.

5. Scope Note (Minimal)  
   - In a single sentence, state that outcomes may vary and official authorities or legal professionals should be consulted for case-specific decisions.

"""


    user_prompt = f"""
User Question:
{question}

Retrieved Indian Cybercrime Case Records:
{context}

INSTRUCTIONS:
Using ONLY the retrieved case records above:

- Compare the user’s situation with similar cases.
- Explain what occurred in those cases and how they were handled.
- Identify the practical next steps that victims took or were guided to take.
- Clearly indicate when information is missing or inconclusive.

Ensure the response follows the exact structure specified in the system instructions.

Final Answer:
"""

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        temperature=0.2,
        max_tokens=700,
    )


    answer_text = response.choices[0].message.content
    return answer_text, case_summaries


