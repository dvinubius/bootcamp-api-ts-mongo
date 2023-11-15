import { AnyZodObject } from 'zod';

export default interface RequestValidator {
  body?: AnyZodObject;
  query?: AnyZodObject;
}
