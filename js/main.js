import projects from '../assets/data/projects.js';

document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('projects');
    const projectList = document.getElementById('projects-grid');
    if (!container) {
        console.warn('No #projects container found.');
        return;
    }

    // template element
    const template = document.getElementById('project-template');
    if (!template) {
        console.warn('No #project-template found.');
        return;
    }

    projects.forEach((p) => {
        if(p.active === false) return; // only show active projects
        const clone = template.content.cloneNode(true);
        // clone is a DocumentFragment — grab the article element inside it
        const article = clone.querySelector('.project');
        if (!article) {
            console.warn('Template does not contain .project article');
            return;
        }

        // Meta
        const groupNum = clone.querySelector('.project__group-num');
        if (groupNum) groupNum.textContent = String(p.group);

        const timeEl = clone.querySelector('.project__time');
        if (timeEl) {
            timeEl.setAttribute('datetime', `${p.time.start}/${p.time.end}`);
            const start = timeEl.querySelector('.project__start');
            const end = timeEl.querySelector('.project__end');
            if (start) start.textContent = p.time.start;
            if (end) end.textContent = p.time.end;
        }

        // const status = clone.querySelector('.project__status');
        // if (status) {
        //     status.textContent = p.active ? 'Actief' : 'Afwezig';
        //     // expose / hide status to assistive tech depending on active state
        //     status.setAttribute('aria-hidden', p.active ? 'false' : 'true');
        //     if (p.active) article.classList.add('project--active');
        // }

        // Title
        const title = clone.querySelector('.project__title');
        if (title) title.textContent = p.title;

        // Members
        const membersList = clone.querySelector('.project__members');
        if (membersList) {
            membersList.innerHTML = ''; // clear template content
            p.members.forEach((m) => {
                const li = document.createElement('li');
                li.textContent = m;
                membersList.appendChild(li);
            });
        }

        // Notes
        // const notesEl = clone.querySelector('.project__notes');
        // if (notesEl) {
        //     if (p.notes) {
        //         notesEl.hidden = false;
        //         notesEl.textContent = p.notes;
        //     } else {
        //         notesEl.hidden = true;
        //         notesEl.textContent = '';
        //     }
        // }

        // Gallery / Images
        const gallery = clone.querySelector('.project__gallery');
        if (gallery) {
            // template image element inside the template article
            const imgTemplate = gallery.querySelector('.project__image');
            // remove any children (including the template image) so we can append real images
            gallery.innerHTML = '';

            if (Array.isArray(p.images) && p.images.length) {
                p.images.forEach((src, i) => {
                    const img = imgTemplate ? imgTemplate.cloneNode(true) : document.createElement('img');
                    img.classList.add('project__image');
                    img.src = src;
                    img.alt = `${p.title} afbeelding ${i + 1}`;
                    img.hidden = false;
                    gallery.appendChild(img);
                });
            }
        }

        projectList.appendChild(clone);
    });
});