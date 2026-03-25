// shorthand
const el = s => document.querySelector(s);

function toggleApiKey() {
    const provider = el("#provider-select").value;
    el("#api-key-group").style.display = provider === "groq" ? "none" : "flex";
}

function fillTopic(btn) {
    el("#topic-input").value = btn.textContent;
    el("#topic-input").focus();
}

function setStatus(text, show = true) {
    el("#status-text").textContent = text;
    el("#status-bar").style.display = show ? "flex" : "none";
}

function addArgumentCard(side, round) {
    const container = el(`#${side}-arguments`);
    const card = document.createElement("div");
    card.className = "argument-card typing-cursor";
    card.id = `${side}-round-${round}`;
    card.innerHTML = `<div class="argument-round">Round ${round}</div><span class="arg-text"></span>`;
    container.appendChild(card);
    container.scrollTop = container.scrollHeight;
}

function appendChunk(side, round, text) {
    if (!el(`#${side}-round-${round}`)) addArgumentCard(side, round);
    const span = el(`#${side}-round-${round} .arg-text`);
    if (span) {
        span.textContent += text;
        el(`#${side}-arguments`).scrollTop = el(`#${side}-arguments`).scrollHeight;
    }
}

function finishCard(side, round) {
    const card = el(`#${side}-round-${round}`);
    if (card) card.classList.remove("typing-cursor");
}

function renderVerdict(markdown) {
    let html = markdown
        .replace(/## (.+)/g, "<h2>$1</h2>")
        .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
        .replace(/\n\n/g, "</p><p>")
        .replace(/\n/g, "<br>");
    el("#verdict-content").innerHTML = "<p>" + html + "</p>";
    el("#verdict-section").style.display = "block";
    el("#verdict-section").scrollIntoView({ behavior: "smooth", block: "nearest" });
}

async function startDebate() {
    const topic = el("#topic-input").value.trim();
    if (!topic) { el("#topic-input").focus(); return; }

    const provider = el("#provider-select").value;
    const apiKey = el("#api-key-input").value.trim() || null;

    if (provider !== "groq" && !apiKey) {
        alert("Please enter your API key for this provider.");
        return;
    }

    // reset ui
    el("#pro-arguments").innerHTML = "";
    el("#con-arguments").innerHTML = "";
    el("#verdict-content").innerHTML = "";
    el("#verdict-section").style.display = "none";
    el("#arena").style.display = "none";
    el("#how-it-works").style.display = "none";
    el("#start-btn").disabled = true;
    setStatus("Validating topic...");

    const body = { topic, num_rounds: 3, provider };
    if (apiKey) body.api_key = apiKey;

    try {
        const response = await fetch("/api/debate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop();

            for (const line of lines) {
                if (!line.startsWith("data:")) continue;
                const raw = line.slice(5).trim();
                if (!raw) continue;

                let ev;
                try { ev = JSON.parse(raw); } catch { continue; }

                switch (ev.type) {
                    case "round_start":
                        el("#arena").style.display = "grid";
                        setStatus(`Round ${ev.round}/3 - PRO is arguing...`);
                        break;
                    case "pro_chunk":
                        appendChunk("pro", ev.round, ev.content);
                        break;
                    case "con_chunk":
                        if (!el(`#con-round-${ev.round}`))
                            setStatus(`Round ${ev.round}/3 - CON is responding...`);
                        appendChunk("con", ev.round, ev.content);
                        break;
                    case "round_end":
                        finishCard("pro", ev.round);
                        finishCard("con", ev.round);
                        setStatus(ev.round < 3
                            ? `Round ${ev.round}/3 complete. Next round starting...`
                            : "All rounds done. Judge is evaluating...");
                        break;
                    case "judge":
                        setStatus("The judge has reached a verdict.");
                        renderVerdict(ev.content);
                        break;
                    case "error":
                        setStatus(`Error: ${ev.content}`);
                        el("#how-it-works").style.display = "block";
                        el("#start-btn").disabled = false;
                        return;
                    case "done":
                        setStatus("", false);
                        break;
                }
            }
        }
    } catch (err) {
        setStatus(`Connection error: ${err.message}`);
        el("#how-it-works").style.display = "block";
    }

    el("#start-btn").disabled = false;
}

document.addEventListener("DOMContentLoaded", () => {
    el("#topic-input").focus();
    el("#topic-input").addEventListener("keydown", e => {
        if (e.key === "Enter") startDebate();
    });
});
