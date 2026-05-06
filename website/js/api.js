// ClawCloud API Client
const API_BASE = 'http://localhost:3000/api';

// ============ API Client ============
const api = {
    // Employees
    async getEmployees() {
        const res = await fetch(`${API_BASE}/employees`);
        const json = await res.json();
        return json.success ? json.data : [];
    },

    async getEmployee(id) {
        const res = await fetch(`${API_BASE}/employees/${id}`);
        const json = await res.json();
        return json.success ? json.data : null;
    },

    async createEmployee(data) {
        const res = await fetch(`${API_BASE}/employees`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        const json = await res.json();
        return json.success ? json.data : null;
    },

    async updateEmployee(id, data) {
        const res = await fetch(`${API_BASE}/employees/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        const json = await res.json();
        return json.success ? json.data : null;
    },

    async toggleEmployee(id, isWorking) {
        const res = await fetch(`${API_BASE}/employees/${id}/toggle`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isWorking })
        });
        const json = await res.json();
        return json.success ? json.data : null;
    },

    async deleteEmployee(id) {
        const res = await fetch(`${API_BASE}/employees/${id}`, {
            method: 'DELETE'
        });
        return res.ok;
    },

    async cloneEmployee(id) {
        const res = await fetch(`${API_BASE}/employees/${id}/clone`, {
            method: 'POST'
        });
        const json = await res.json();
        return json.success ? json.data : null;
    },

    // Stats
    async getDashboardStats() {
        const res = await fetch(`${API_BASE}/stats/dashboard`);
        const json = await res.json();
        return json.success ? json.data : null;
    },

    async getUsageTrend(days = 7) {
        const res = await fetch(`${API_BASE}/stats/usage-trend?days=${days}`);
        const json = await res.json();
        return json.success ? json.data : null;
    },

    async getActivities(limit = 20) {
        const res = await fetch(`${API_BASE}/stats/activities?limit=${limit}`);
        const json = await res.json();
        return json.success ? json.data : [];
    },

    // Billing
    async getTodayBilling() {
        const res = await fetch(`${API_BASE}/billing/today`);
        const json = await res.json();
        return json.success ? json.data : null;
    },

    async getBillingHistory(startDate, endDate) {
        let url = `${API_BASE}/billing/history`;
        const params = new URLSearchParams();
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);
        if (params.toString()) url += '?' + params.toString();

        const res = await fetch(url);
        const json = await res.json();
        return json.success ? json.data : null;
    }
};

// ============ Data Store (Reactive) ============
const store = {
    employees: [],
    stats: null,
    billing: null,
    activities: [],
    listeners: [],

    async init() {
        await Promise.all([
            this.loadEmployees(),
            this.loadStats(),
            this.loadBilling(),
            this.loadActivities()
        ]);
        this.notify();
    },

    async loadEmployees() {
        this.employees = await api.getEmployees();
    },

    async loadStats() {
        this.stats = await api.getDashboardStats();
    },

    async loadBilling() {
        this.billing = await api.getTodayBilling();
    },

    async loadActivities() {
        this.activities = await api.getActivities();
    },

    subscribe(callback) {
        this.listeners.push(callback);
    },

    notify() {
        this.listeners.forEach(cb => cb(this));
    },

    // Actions
    async hireEmployee(data) {
        const emp = await api.createEmployee(data);
        if (emp) {
            this.employees.push(emp);
            await this.loadStats();
            await this.loadActivities();
            this.notify();
            return emp;
        }
        return null;
    },

    async toggleWork(id, isWorking) {
        const emp = await api.toggleEmployee(id, isWorking);
        if (emp) {
            const idx = this.employees.findIndex(e => e._id === id || e.id === id);
            if (idx !== -1) this.employees[idx] = emp;
            await this.loadStats();
            await this.loadActivities();
            this.notify();
            return emp;
        }
        return null;
    },

    async fireEmployee(id) {
        const ok = await api.deleteEmployee(id);
        if (ok) {
            this.employees = this.employees.filter(e => (e._id !== id && e.id !== id));
            await this.loadStats();
            await this.loadActivities();
            this.notify();
            return true;
        }
        return false;
    },

    async cloneEmployee(id) {
        const emp = await api.cloneEmployee(id);
        if (emp) {
            this.employees.push(emp);
            await this.loadStats();
            await this.loadActivities();
            this.notify();
            return emp;
        }
        return null;
    }
};

// Export for use in main script
window.clawcloud = { api, store };
