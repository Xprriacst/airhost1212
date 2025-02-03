"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OfficialWhatsAppService = void 0;
var OfficialWhatsAppService = /** @class */ (function () {
    function OfficialWhatsAppService(config) {
        this.config = config;
    }
    OfficialWhatsAppService.prototype.isWithin24Hours = function (lastMessageTimestamp) {
        if (!lastMessageTimestamp)
            return false;
        var now = new Date();
        var diff = now.getTime() - lastMessageTimestamp.getTime();
        return diff <= 24 * 60 * 60 * 1000; // 24 heures en millisecondes
    };
    OfficialWhatsAppService.prototype.sendMessage = function (to, content) {
        return __awaiter(this, void 0, void 0, function () {
            var useTemplate, payload, controller_1, timeoutId, response, responseText, data, messageId, error_1;
            var _a, _b, _c;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        _d.trys.push([0, 3, , 4]);
                        console.log('📤 Envoi de message WhatsApp (API officielle):', {
                            to: to,
                            content: content,
                            phoneNumberId: this.config.phoneNumberId,
                            apiUrl: this.config.apiUrl
                        });
                        useTemplate = !this.isWithin24Hours(((_a = content.metadata) === null || _a === void 0 ? void 0 : _a.lastMessageTimestamp) || null);
                        payload = void 0;
                        if (useTemplate) {
                            payload = {
                                messaging_product: 'whatsapp',
                                recipient_type: 'individual',
                                to: to,
                                type: 'template',
                                template: {
                                    name: 'hello_world',
                                    language: {
                                        code: 'en_US'
                                    }
                                }
                            };
                            console.log('📤 Utilisation d\'un template car hors fenêtre de 24h');
                        }
                        else {
                            payload = {
                                messaging_product: 'whatsapp',
                                recipient_type: 'individual',
                                to: to,
                                type: 'text',
                                text: {
                                    preview_url: false,
                                    body: content.text
                                }
                            };
                            console.log('📤 Message standard dans la fenêtre de 24h');
                        }
                        console.log('📦 Payload:', JSON.stringify(payload, null, 2));
                        controller_1 = new AbortController();
                        timeoutId = setTimeout(function () { return controller_1.abort(); }, 30000);
                        return [4 /*yield*/, fetch("".concat(this.config.apiUrl, "/").concat(this.config.phoneNumberId, "/messages"), {
                                method: 'POST',
                                headers: {
                                    'Authorization': "Bearer ".concat(this.config.accessToken),
                                    'Content-Type': 'application/json',
                                },
                                body: JSON.stringify(payload),
                                signal: controller_1.signal
                            })];
                    case 1:
                        response = _d.sent();
                        clearTimeout(timeoutId);
                        return [4 /*yield*/, response.text()];
                    case 2:
                        responseText = _d.sent();
                        console.log('📥 Réponse brute:', responseText);
                        if (!response.ok) {
                            console.error('❌ Erreur API WhatsApp:', {
                                status: response.status,
                                statusText: response.statusText,
                                response: responseText
                            });
                            throw new Error("Erreur API WhatsApp: ".concat(response.status, " ").concat(response.statusText, " - ").concat(responseText));
                        }
                        data = JSON.parse(responseText);
                        console.log('✅ Réponse parsée:', data);
                        messageId = (_c = (_b = data.messages) === null || _b === void 0 ? void 0 : _b[0]) === null || _c === void 0 ? void 0 : _c.id;
                        console.log('📱 Message ID:', messageId);
                        return [2 /*return*/, messageId || ''];
                    case 3:
                        error_1 = _d.sent();
                        console.error('Erreur lors de l\'envoi via l\'API WhatsApp:', error_1);
                        throw error_1;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    OfficialWhatsAppService.prototype.getMessageStatus = function (messageId) {
        return __awaiter(this, void 0, void 0, function () {
            var response, data, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        return [4 /*yield*/, fetch("".concat(this.config.apiUrl, "/").concat(messageId), {
                                headers: {
                                    'Authorization': "Bearer ".concat(this.config.accessToken),
                                },
                            })];
                    case 1:
                        response = _a.sent();
                        if (!response.ok) {
                            throw new Error("Erreur lors de la r\u00E9cup\u00E9ration du statut: ".concat(response.statusText));
                        }
                        return [4 /*yield*/, response.json()];
                    case 2:
                        data = _a.sent();
                        return [2 /*return*/, this.mapStatus(data.status)];
                    case 3:
                        error_2 = _a.sent();
                        console.error('Erreur lors de la récupération du statut:', error_2);
                        throw error_2;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    OfficialWhatsAppService.prototype.markMessageAsRead = function (messageId) {
        return __awaiter(this, void 0, void 0, function () {
            var error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, fetch("".concat(this.config.apiUrl, "/").concat(messageId, "/mark_as_read"), {
                                method: 'POST',
                                headers: {
                                    'Authorization': "Bearer ".concat(this.config.accessToken),
                                },
                            })];
                    case 1:
                        _a.sent();
                        return [3 /*break*/, 3];
                    case 2:
                        error_3 = _a.sent();
                        console.error('Erreur lors du marquage comme lu:', error_3);
                        throw error_3;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    OfficialWhatsAppService.prototype.handleWebhook = function (payload) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // Traitement des webhooks de l'API officielle
                console.log('Message reçu via l\'API officielle:', payload);
                return [2 /*return*/];
            });
        });
    };
    OfficialWhatsAppService.prototype.mapStatus = function (apiStatus) {
        var statusMap = {
            'sent': 'sent',
            'delivered': 'delivered',
            'read': 'read',
            'failed': 'failed',
        };
        return statusMap[apiStatus] || 'sent';
    };
    return OfficialWhatsAppService;
}());
exports.OfficialWhatsAppService = OfficialWhatsAppService;
