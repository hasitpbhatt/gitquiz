// @ts-check

function showNotify(title, msg) {
    const div = document.createElement('div');
    div.className = "fixed bottom-4 left-1/2 -translate-x-1/2 w-[90%] max-w-sm glass-card p-4 rounded-xl shadow-2xl z-50 animate-in fade-in slide-in-from-bottom-4";
    div.innerHTML = `
        <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold">!</div>
            <div>
                <h4 class="font-800 text-sm">${title}</h4>
                <p class="text-xs text-slate-500">${msg}</p>
            </div>
        </div>
    `;
    document.body.appendChild(div);
    setTimeout(() => {
        div.classList.add('animate-out', 'fade-out', 'slide-out-to-bottom-4');
        setTimeout(() => div.remove(), 500);
    }, 3000);
}

function showNotifyWithAction(title, msg, actionLabel, actionFn) {
    const div = document.createElement('div');
    div.className = "fixed bottom-4 left-1/2 -translate-x-1/2 w-[90%] max-w-sm glass-card p-4 rounded-xl shadow-2xl z-50 animate-in fade-in slide-in-from-bottom-4";
    div.innerHTML = `
        <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold">!</div>
            <div class="flex-1">
                <h4 class="font-800 text-sm">${title}</h4>
                <p class="text-xs text-slate-500">${msg}</p>
            </div>
            <button class="notify-action px-3 py-1.5 bg-blue-600 text-white text-xs font-700 rounded-lg whitespace-nowrap">${actionLabel}</button>
        </div>
    `;
    document.body.appendChild(div);
    div.querySelector('.notify-action').addEventListener('click', () => {
        actionFn();
        div.classList.add('animate-out', 'fade-out', 'slide-out-to-bottom-4');
        setTimeout(() => div.remove(), 500);
    });
    setTimeout(() => {
        div.classList.add('animate-out', 'fade-out', 'slide-out-to-bottom-4');
        setTimeout(() => div.remove(), 500);
    }, 6000);
}
