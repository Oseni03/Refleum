import winston from "winston";

const levels = {
	error: 0,
	warn: 1,
	info: 2,
	http: 3,
	debug: 4,
};

const level = () => {
	const env = process.env.NODE_ENV || "development";
	return env === "development" ? "debug" : "info";
};

const colors = {
	error: "red",
	warn: "yellow",
	info: "green",
	http: "magenta",
	debug: "cyan",
};

winston.addColors(colors);

const format = winston.format.combine(
	winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss:SSS" }),
	winston.format.errors({ stack: true }), // Show stack traces for errors
	winston.format.splat(), // Support %s, %d etc. if needed
	winston.format.json({ space: 2 }), // Fallback for files
);

// Console format (human readable + metadata)
const consoleFormat = winston.format.combine(
	winston.format.colorize({ all: true }),
	winston.format.printf(({ timestamp, level, message, ...meta }) => {
		let metaStr = "";

		if (Object.keys(meta).length > 0) {
			// Pretty print metadata
			metaStr = ` ${JSON.stringify(meta, null, 2)
				.replace(/"([^"]+)":/g, "$1:") // Remove quotes from keys
				.replace(/\n/g, " ")}`;
		}

		return `${timestamp} [${level}]: ${message}${metaStr}`;
	}),
);

const transports = [
	// Console (pretty)
	new winston.transports.Console({
		format: consoleFormat,
	}),

	// Error file
	new winston.transports.File({
		filename: "logs/error.log",
		level: "error",
		format: winston.format.combine(
			winston.format.timestamp(),
			winston.format.json(),
		),
	}),

	// Combined logs (structured JSON - best for production)
	new winston.transports.File({
		filename: "logs/all.log",
		format: winston.format.combine(
			winston.format.timestamp(),
			winston.format.json(),
		),
	}),
];

const logger = winston.createLogger({
	level: level(),
	levels,
	format, // Default format
	transports,
	// Optional: Exit on uncaught errors
	exitOnError: false,
});

export default logger;
