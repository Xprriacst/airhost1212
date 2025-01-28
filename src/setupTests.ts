import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';
import { fetch, Request, Response } from 'cross-fetch';

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder as any;
global.fetch = fetch;
global.Request = Request as any;
global.Response = Response as any;
