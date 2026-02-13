
const PdfGenerator = {
    generate(tailoredData, jobDescription) {
         // Check if jsPDF is loaded
        if (!window.jspdf) {
            console.error("jsPDF library not found");
            alert("PDF generation requires jsPDF library. Please ensure it is loaded.");
            return;
        }

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        const pageWidth = doc.internal.pageSize.getWidth();
        const margin = 20;
        let y = margin;
        const lineHeight = 7;

        // Helper to add text and wrap it
        function addText(text, fontSize = 10, fontStyle = "normal") {
            doc.setFontSize(fontSize);
            doc.setFont("helvetica", fontStyle);
            const lines = doc.splitTextToSize(text, pageWidth - 2 * margin);
            
            // Check for page break
            if (y + lines.length * lineHeight > doc.internal.pageSize.getHeight() - margin) {
                doc.addPage();
                y = margin;
            }
            
            doc.text(lines, margin, y);
            y += lines.length * lineHeight + 2;
        }

        function addHeader(text) {
             y += 5;
             addText(text, 14, "bold");
             y += 2;
        }

        // Title
        addText(tailoredData.basics?.name || "Tailored Resume", 18, "bold");
        addText(tailoredData.basics?.email || "", 10);
        y += 5;

        // Summary
        if (tailoredData.basics?.summary) {
            addHeader("Summary");
            addText(tailoredData.basics.summary);
        }

        // Experience
        if (tailoredData.work && tailoredData.work.length > 0) {
            addHeader("Experience");
            tailoredData.work.forEach(job => {
                const title = `${job.position} at ${job.name}`;
                const date = `${job.startDate || ''} - ${job.endDate || 'Present'}`;
                addText(title, 11, "bold");
                addText(date, 9, "italic");
                addText(job.summary || "");
                if (job.highlights) {
                    job.highlights.forEach(h => addText("• " + h));
                }
                y += 5;
            });
        }

        // Education
         if (tailoredData.education && tailoredData.education.length > 0) {
            addHeader("Education");
            tailoredData.education.forEach(edu => {
                const title = `${edu.institution} - ${edu.area}`;
                const date = `${edu.startDate || ''} - ${edu.endDate || ''}`;
                addText(title, 11, "bold");
                addText(date, 9, "italic");
                 y += 5;
            });
        }

        // Skills
        if (tailoredData.skills && tailoredData.skills.length > 0) {
            addHeader("Skills");
            const skills = tailoredData.skills.map(s => s.name).join(", ");
            addText(skills);
        }

        doc.save("tailored-resume.pdf");
    }
};
