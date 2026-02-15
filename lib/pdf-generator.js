const PdfGenerator = {
    generate(resumeData, template = "modern") {
        if (!window.jspdf) {
            console.error("jsPDF library not found");
            alert("PDF generation requires jsPDF library.");
            return;
        }

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        const pageWidth = doc.internal.pageSize.getWidth(); // ~210mm
        const pageHeight = doc.internal.pageSize.getHeight(); // ~297mm
        const margin = 20;
        let y = margin;
        const lineHeight = 6;

        // --- Template Styles ---
        const styles = {
            modern: { titleFont: "helvetica", titleColor: [0, 0, 0], headerColor: [0, 0, 0] },
            classic: { titleFont: "times", titleColor: [55, 65, 81], headerColor: [55, 65, 81] },
            creative: { titleFont: "helvetica", titleColor: [99, 102, 241], headerColor: [99, 102, 241] }
        };
        const currentStyle = styles[template] || styles.modern;

        // --- Helpers ---
        function addText(text, fontSize = 10, fontStyle = "normal", color = [0, 0, 0]) {
            if (!text) return;
            doc.setFontSize(fontSize);
            doc.setFont(currentStyle.titleFont, fontStyle);
            doc.setTextColor(...color);
            
            const lines = doc.splitTextToSize(text, pageWidth - 2 * margin);
            
            // Allow for page break
            if (y + lines.length * lineHeight > pageHeight - margin) {
                doc.addPage();
                y = margin;
            }
            
            doc.text(lines, margin, y);
            y += lines.length * lineHeight * 0.5 + 2; 
        }

        // --- Content Generation (Schema: ResumeData) ---
        const { personalInfo, sections } = resumeData;

        // 1. Header
        addText(personalInfo.fullName, 22, "bold", currentStyle.titleColor);
        addText(personalInfo.jobTitle, 14, "normal", [100, 100, 100]);
        y += 4;
        
        const contactInfo = [
            personalInfo.email, 
            personalInfo.phone, 
            personalInfo.city
        ].filter(Boolean).join(" | ");
        addText(contactInfo, 10, "normal", [80, 80, 80]);
        y += 8;

        // 2. Summary
        if (personalInfo.summary) {
            addHeader("Summary");
            addText(personalInfo.summary, 10);
            y += 4;
        }

        // 3. Sections
        if (sections && Array.isArray(sections)) {
            // Sort sections by order if available, or keep as is
            sections.forEach(section => {
                if (!section.isVisible) return;
                
                // Skip if empty items
                if (!section.items || section.items.length === 0) return;

                addHeader(section.title);

                if (section.type === "skills") {
                    // Render skills as a comma-separated list
                    const skills = section.items
                        .filter(i => i.isVisible !== false)
                        .map(i => i.title)
                        .join(", ");
                    addText(skills, 10);
                } else {
                    // Render list items (Experience, Education, Projects)
                    section.items.forEach(item => {
                        if (item.isVisible === false) return;
                        
                        // Title row (e.g. Company - Role)
                        const title = item.title;
                        const subtitle = item.subtitle ? ` - ${item.subtitle}` : "";
                        addText(`${title}${subtitle}`, 11, "bold", [40, 40, 40]);
                        
                        // Metadata row (Date | Location)
                        const meta = [item.date, item.location].filter(Boolean).join(" | ");
                        if (meta) {
                            addText(meta, 9, "italic", [100, 100, 100]);
                        }

                        // Description
                        if (item.description) {
                            // Strip HTML tags for PDF text
                            const plainDesc = item.description.replace(/<[^>]*>?/gm, "");
                            addText(plainDesc, 9, "normal", [60, 60, 60]);
                        }
                        y += 4; // spacing between items
                    });
                }
                y += 4; // spacing between sections
            });
        }

        function addHeader(text) {
            y += 4;
            // Draw underline or background depending on style could go here
            doc.setFontSize(12);
            doc.setFont(currentStyle.titleFont, "bold");
            doc.setTextColor(...currentStyle.headerColor);
            doc.text(text.toUpperCase(), margin, y);
            
            // Line under header
            doc.setDrawColor(...currentStyle.headerColor);
            doc.setLineWidth(0.5);
            doc.line(margin, y + 2, pageWidth - margin, y + 2);
            
            y += 8;
        }

        doc.save(`${personalInfo.fullName.replace(/\s+/g, "_")}_CV.pdf`);
    }
};
