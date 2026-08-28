UPDATE users
   SET avatar = '/avatar-female.png'
 WHERE avatar LIKE '%/avatar-female.png' AND avatar <> '/avatar-female.png';

UPDATE users
   SET avatar = '/avatar-male.png'
 WHERE avatar LIKE '%/avatar-male.png' AND avatar <> '/avatar-male.png';
