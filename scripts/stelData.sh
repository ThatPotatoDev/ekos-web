#!/bin/sh

DATA_DIR="../server/static/stellarium-data"
ZIP_DIR="./stelDataZips"
ROOT_URL="https://stellarium.sfo2.cdn.digitaloceanspaces.com"
SDP_URL="$ROOT_URL/swe-data-packs"
MPC_URL="$ROOT_URL/mpc/v1"

mkdir -p $DATA_DIR
mkdir -p $ZIP_DIR

echo "Downloading SWE Data Packs"
curl -# --output-dir $ZIP_DIR -o minimal.zip $SDP_URL/minimal/2020-09-01/minimal_2020-09-01_186e7ee2.zip
curl -# --output-dir $ZIP_DIR -o base.zip $SDP_URL/base/2020-09-01/base_2020-09-01_1aa210df.zip
curl -# --output-dir $ZIP_DIR -o extended.zip $SDP_URL/extended/2020-03-11/extended_2020-03-11_26aa5ab8.zip
echo "Downloaded SWE Data Packs"

curl -# --output-dir $DATA_DIR -o CometEls.txt $MPC_URL/CometEls.txt
curl -# --output-dir $DATA_DIR -o mpcorb.dat $MPC_URL/mpcorb.dat
echo "Downloaded Comet and Asteroid/MinorPlanet data"

echo "Unzipping SWE Data Packs"
unzip -q -o $ZIP_DIR/minimal.zip -d $DATA_DIR/minimal
unzip -q -o $ZIP_DIR/base.zip -d $DATA_DIR/base
unzip -q -o $ZIP_DIR/extended.zip -d $DATA_DIR/extended
echo "Unzipped SWE Data Packs"

rm -rf $DATA_DIR/base/surveys/dss
rm -rf $DATA_DIR/extended/surveys
echo "Removed unnecessary survey data from SWE Data Packs"