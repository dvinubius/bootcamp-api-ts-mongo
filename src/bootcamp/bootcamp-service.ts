import slugify from 'slugify';
import { ObjectId, WithId } from 'mongodb';
import _ from 'lodash';

import geocoder from '../utils/geocoder.js';
import {
  Bootcamp,
  BootcampCreateDto,
  BootcampPopulated,
  BootcampUpdateDto,
  Bootcamps,
} from './bootcamp-model.js';
import { Location } from './types/location.type.js';
import {
  BootcampJoinedSubDoc,
  USER_BC_JOINED_FIELDS,
  USER_BC_OWNED_FIELDS,
  User,
  Users,
} from '../user/user-model.js';
import { COURSE_BOOTCAMP_FIELDS, Courses } from '../course/course-model.js';
import { REVIEW_BOOTCAMP_FIELDS, Reviews } from '../review/review-model.js';
import { BootcampOwnedSubDoc } from '../user/user-model.js';
import { populateBootcampAggStages } from './aggregation/bootcamp-populate-stages.js';

export const getPopulatedBootcamps = async (
  matchCondition: Object
): Promise<WithId<BootcampPopulated>[]> => {
  const cursor = Bootcamps.aggregate([
    {
      $match: matchCondition,
    },
    ...populateBootcampAggStages,
  ]);
  const results = (await cursor.toArray()) as WithId<BootcampPopulated>[];
  return results;
};

export const execCreateBootcamp = async (
  dto: BootcampCreateDto,
  loggedUser: WithId<User>
) => {
  const bootcampData = await newBootcampData(dto, loggedUser);
  const result = await Bootcamps.insertOne(bootcampData);
  const bootcampId = new ObjectId(result.insertedId.toString()); // workaround for insertedID being a string even though TS suggests it's an ObjectId

  // for the user who owns this bootcamp
  await updateOwnership(loggedUser._id, bootcampId, bootcampData);

  const [populated] = await getPopulatedBootcamps({ _id: bootcampId });
  return populated;
};

export const execUpdateBootcamp = async (
  dto: BootcampUpdateDto,
  bootcamp: WithId<Bootcamp>
) => {
  const update = {
    ...dto,
    ...(await updatedSlugAndLocation(bootcamp, dto)),
  };

  await Bootcamps.findOneAndUpdate({ _id: bootcamp._id }, { $set: update });

  // for reviews, courses, participant users may reference this bootcamp
  await execCrossUpdates(bootcamp, update);

  const [populated] = await getPopulatedBootcamps({
    _id: bootcamp._id,
  });

  return populated;
};

export const execRegisterForBootcamp = async (
  bootcampId: ObjectId,
  userId: ObjectId
) => {
  const updatedBootcamp = await Bootcamps.findOneAndUpdate(
    { _id: bootcampId },
    { $push: { participants: userId } }
  );

  // for users who joined this bootcamp
  await updateJoinedBootcamps(userId, updatedBootcamp!);

  const [populated] = await getPopulatedBootcamps({
    _id: updatedBootcamp!._id,
  });

  return populated;
};

export const execDeleteBootcamp = async (
  bootcamp: WithId<Bootcamp>,
  ownerDeletedAlready = false
) => {
  await Bootcamps.deleteOne({ _id: bootcamp._id });
  // cascade delete: reviews & courses pertaining to this bootcamp
  // update owner's data
  // update joined users' data
  await cleanupAfterDelete(bootcamp, ownerDeletedAlready);
};

// ---------------- INTENRAL ---------------- //

const newBootcampData = async (
  dto: BootcampCreateDto,
  loggedUser: WithId<User>
): Promise<Bootcamp> => {
  const slug = slugify.default(dto.name, { lower: true });
  const { location, address } = await getLocationUpdate(dto.address);

  return {
    ...dto,
    slug,
    location,
    address,
    averageRating: 0, // setting so that field can be mandatory
    averageCost: 0, // setting so that field can be mandatory
    owner: loggedUser._id,
    participants: [],
    courses: [],
  };
};

const updatedSlugAndLocation = async (
  bootcamp: Bootcamp,
  updateData: {
    address?: string;
    name?: string;
  }
) => {
  const ret: {
    slug?: string;
    location?: Location;
    address?: string;
  } = {};
  if (updateData.name) {
    ret.slug = slugify.default(bootcamp.name, { lower: true });
  }
  if (updateData.address) {
    const { location, address } = await getLocationUpdate(bootcamp.address);
    ret.location = location;
    ret.address = address;
  }
  return ret;
};

const updateOwnership = async (
  userId: ObjectId,
  bootcampId: ObjectId,
  bootcamp: Bootcamp
) => {
  const bootcampSubDoc: BootcampOwnedSubDoc = {
    _id: bootcampId,
    ..._.pick(bootcamp, USER_BC_OWNED_FIELDS),
  };
  await Users.updateOne(
    { _id: userId },
    { $set: { bootcampOwned: bootcampSubDoc } }
  );
};

const updateJoinedBootcamps = async (
  userId: ObjectId,
  bootcamp: WithId<Bootcamp>
) => {
  const bootcampSubDoc: BootcampJoinedSubDoc = _.pick(bootcamp, [
    '_id',
    ...USER_BC_JOINED_FIELDS,
  ]);
  await Users.findOneAndUpdate(
    { _id: userId },
    { $push: { bootcampsJoined: bootcampSubDoc } }
  );
};

const execCrossUpdates = async (
  bootcamp: WithId<Bootcamp>,
  update: Partial<Bootcamp>
) => {
  // courses of this bootcamp
  if (
    Object.keys(update).some((key) =>
      (COURSE_BOOTCAMP_FIELDS as readonly string[]).includes(key)
    )
  ) {
    await Courses.updateMany(
      { bootcamp: { _id: bootcamp._id } },
      { bootcamp: { name: update.name } }
    );
  }

  // reviews for this bootcamp
  if (
    Object.keys(update).some((key) =>
      (REVIEW_BOOTCAMP_FIELDS as readonly string[]).includes(key)
    )
  ) {
    await Reviews.updateMany(
      { bootcamp: { _id: bootcamp._id } },
      { bootcamp: { name: update.name } }
    );
  }

  // users who joined this bootcamp
  if (
    Object.keys(update).some((key) =>
      (USER_BC_JOINED_FIELDS as readonly string[]).includes(key)
    )
  ) {
    await Users.updateMany(
      {
        _id: { $in: bootcamp.participants },
        'bootcampsJoined._id': bootcamp._id,
      },
      {
        $set: { 'joinedBootcamps.$.name': update.name },
      }
    );
  }

  // owner of bootcamp
  if (
    Object.keys(USER_BC_OWNED_FIELDS).some((key) =>
      (USER_BC_OWNED_FIELDS as readonly string[]).includes(key)
    )
  ) {
    await Users.updateOne(
      {
        _id: bootcamp.owner,
      },
      {
        $set: { 'bootcampOwned.name': update.name },
      }
    );
  }
};

const cleanupAfterDelete = async (
  bootcamp: WithId<Bootcamp>,
  ownerDeletedAlready: boolean
) => {
  if (!ownerDeletedAlready) {
    await Users.updateOne(
      { _id: bootcamp.owner },
      { $unset: { bootcampOwned: '' } }
    );
  }
  await Users.updateMany(
    { _id: { $in: bootcamp.participants } },
    { bootcampsJoined: { $pull: bootcamp._id } }
  );
  await Courses.deleteMany({ bootcamp: { _id: bootcamp._id } });
  await Reviews.deleteMany({ bootcamp: { _id: bootcamp._id } });
};

const getLocationUpdate = async (inputAddress: string) => {
  const loc = await geocoder.geocode(inputAddress);
  const locData = validateLocation(loc[0], inputAddress);

  const location: Location = {
    type: 'Point',
    coordinates: [locData.longitude, locData.latitude],
    formattedAddress: locData.formattedAddress,
    street: locData.streetName ?? '', // some legit addresses don't have streetName
    city: locData.city,
    zipcode: locData.zipcode,
    country: locData.countryCode,
  };

  const address = loc[0].formattedAddress ?? inputAddress;
  return { location, address };
};

// there is no type exported for node_geocoder.Entry, hence this helper
const validateLocation = (entry: any, address: string) => {
  const ok =
    entry.longitude &&
    entry.latitude &&
    entry.formattedAddress &&
    entry.city &&
    entry.zipcode &&
    entry.countryCode;
  if (!ok) {
    throw new Error(
      `Google API could not properly decode geo location from address: ${address}`
    );
  }
  return entry;
};
