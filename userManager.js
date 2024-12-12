const readline = require("readline");
const fs = require("fs");

const roles = {
    admin: 0,
    teacher: 1,
    student: 2,
};

const usersFile = "./users.json"; // Chemin vers le fichier contenant les utilisateurs
function loadUsers(filePath) {
    try {
        const data = fs.readFileSync(filePath, "utf8");
        return JSON.parse(data); // Charge les utilisateurs depuis le fichier JSON
    } catch (err) {
        console.error("Failed to load users:", err.message);
        return [];
    }
}

const users = loadUsers(usersFile);

function identifyUser(userName) {
    const user = users.find(u => u.name === userName);
    if (user) {
        return roles[user.role];
    } else {
        return null;
    }
}

function checkPermission(userName, users, requiredRole) {
    const userRole = identifyUser(userName, users);
    if (userRole === null) {
        return false;
    }
    return userRole <= requiredRole;
}

function promptUserForName() {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    return new Promise((resolve) => {
        rl.question("This command is restricted \n Please enter your username: ", (answer) => {
            rl.close();
            resolve(answer);
        });
    });
}

module.exports = {
    roles,
    users,
    checkPermission,
    promptUserForName,
};