import { WithId } from 'mongodb';

import { User, Users } from './user-model.js';
import { Bootcamps } from '../bootcamp/bootcamp-model.js';
import { execDeleteBootcamp } from '../bootcamp/bootcamp-service.js';
import { Reviews } from '../review/review-model.js';

export const execDeleteUser = async (user: WithId<User>) => {
  await Users.deleteOne({ _id: user._id });
  await cleanupAfterDelete(user);
};

// ----------------- INTERNAL -----------------

const cleanupAfterDelete = async (user: WithId<User>) => {
  // delete reviews this user has written
  await Reviews.deleteMany({ author: { _id: user._id } });

  // update bootcamps where this user was a participant
  const bootcampsJoinedIds = user.bootcampsJoined.map(
    (bootcamp) => bootcamp._id
  );
  await Bootcamps.updateMany(
    { _id: { $in: bootcampsJoinedIds } },
    {
      participants: { $pull: user._id },
    }
  );

  // delete owned bootcamp
  const bootcampId = user.bootcampOwned?._id;
  if (bootcampId) {
    const bootcamp = await Bootcamps.findOne({ _id: bootcampId });
    await execDeleteBootcamp(bootcamp!, true);
  }
};
