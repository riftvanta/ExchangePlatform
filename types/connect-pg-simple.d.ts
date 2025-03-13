declare module 'connect-pg-simple' {
  import session from 'express-session';
  
  function PGSession(session: typeof session): new (options?: any) => session.Store;
  
  export = PGSession;
} 